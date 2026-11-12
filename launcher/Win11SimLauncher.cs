/**
 * Windows 11 Arabic Educational Simulator - Portable Single-File Loopback Host (.NET 3.5 SP1 / Win7+ Safe)
 * Embeds Win11_Simulator_1AS.html.gz as a native resource, serves it purely over 127.0.0.1:<port>,
 * manages encrypted sibling inf.dll sidecar via /api/inf, and guarantees zero temp leftovers next to EXE.
 */
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Win11SimHost
{
    static class Program
    {
        private static byte[] _htmlBytes;
        private static string _exeDir;
        private static string _infPath;
        private static HttpListener _listener;
        private static volatile bool _running = true;
        private static Process _browserProcess = null;

        [STAThread]
        static int Main(string[] args)
        {
            _exeDir = AppDomain.CurrentDomain.BaseDirectory;
            _infPath = Path.Combine(_exeDir, "inf.dll");

            int requestedPort = 0;
            bool noBrowser = false;
            for (int i = 0; i < args.Length; i++)
            {
                string a = args[i] ?? "";
                if (a.StartsWith("--port=", StringComparison.OrdinalIgnoreCase))
                {
                    int.TryParse(a.Substring(7), out requestedPort);
                }
                else if (string.Equals(a, "--no-browser", StringComparison.OrdinalIgnoreCase))
                {
                    noBrowser = true;
                }
            }

            try
            {
                _htmlBytes = LoadEmbeddedHtmlBytes();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to load embedded simulator resources:\n" + ex.Message,
                    "Windows 11 Simulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }

            int port = requestedPort > 0 ? requestedPort : FindFreeTcpPort();
            string prefix = string.Format("http://127.0.0.1:{0}/", port);

            _listener = new HttpListener();
            _listener.Prefixes.Add(prefix);
            try
            {
                _listener.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Unable to start local loopback server on " + prefix + "\n" + ex.Message,
                    "Windows 11 Simulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 2;
            }

            Thread serverThread = new Thread(ListenLoop);
            serverThread.IsBackground = true;
            serverThread.Start();

            if (noBrowser)
            {
                Console.WriteLine("WIN11_SIM_HOST_READY=" + prefix);
                Console.Out.Flush();
                ManualResetEvent waitExit = new ManualResetEvent(false);
                Console.CancelKeyPress += delegate(object sender, ConsoleCancelEventArgs e)
                {
                    e.Cancel = true;
                    waitExit.Set();
                };
                while (_running)
                {
                    if (waitExit.WaitOne(250)) break;
                }
                StopServer();
                return 0;
            }

            LaunchUiSession(prefix);
            StopServer();
            return 0;
        }

        private static byte[] LoadEmbeddedHtmlBytes()
        {
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream raw = asm.GetManifestResourceStream("Win11_Simulator_1AS.html.gz"))
            {
                if (raw == null) throw new InvalidOperationException("Missing embedded HTML resource.");
                using (GZipStream gz = new GZipStream(raw, CompressionMode.Decompress))
                using (MemoryStream ms = new MemoryStream())
                {
                    byte[] buf = new byte[65536];
                    int read;
                    while ((read = gz.Read(buf, 0, buf.Length)) > 0)
                    {
                        ms.Write(buf, 0, read);
                    }
                    return ms.ToArray();
                }
            }
        }

        private static int FindFreeTcpPort()
        {
            TcpListener tcp = new TcpListener(IPAddress.Loopback, 0);
            tcp.Start();
            int port = ((IPEndPoint)tcp.LocalEndpoint).Port;
            tcp.Stop();
            return port;
        }

        private static void ListenLoop()
        {
            while (_running && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext ctx = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        HandleRequest((HttpListenerContext)state);
                    }, ctx);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void HandleRequest(HttpListenerContext ctx)
        {
            try
            {
                string path = (ctx.Request.Url != null) ? ctx.Request.Url.AbsolutePath : "/";
                ctx.Response.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate");

                if (path == "/api/inf")
                {
                    if (string.Equals(ctx.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!File.Exists(_infPath))
                        {
                            ctx.Response.StatusCode = 204;
                            ctx.Response.Close();
                            return;
                        }
                        byte[] infBytes = File.ReadAllBytes(_infPath);
                        ctx.Response.StatusCode = 200;
                        ctx.Response.ContentType = "application/octet-stream";
                        ctx.Response.ContentLength64 = infBytes.Length;
                        ctx.Response.OutputStream.Write(infBytes, 0, infBytes.Length);
                        ctx.Response.Close();
                        return;
                    }
                    if (string.Equals(ctx.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
                    {
                        byte[] incoming;
                        using (MemoryStream ms = new MemoryStream())
                        {
                            byte[] buf = new byte[16384];
                            int n;
                            while ((n = ctx.Request.InputStream.Read(buf, 0, buf.Length)) > 0)
                            {
                                ms.Write(buf, 0, n);
                            }
                            incoming = ms.ToArray();
                        }
                        if (incoming.Length < 100 || incoming.Length > 8 * 1024 * 1024)
                        {
                            ctx.Response.StatusCode = 400;
                            ctx.Response.Close();
                            return;
                        }
                        // Verify binary encrypted inf.dll v2 magic header ('W11S\x02') before touching disk
                        if (incoming[0] != 0x57 || incoming[1] != 0x31 || incoming[2] != 0x31 || incoming[3] != 0x53 || incoming[4] != 0x02)
                        {
                            ctx.Response.StatusCode = 400;
                            ctx.Response.Close();
                            return;
                        }
                        string tmpPath = _infPath + ".tmp";
                        File.WriteAllBytes(tmpPath, incoming);
                        if (File.Exists(_infPath))
                        {
                            File.Replace(tmpPath, _infPath, null);
                        }
                        else
                        {
                            File.Move(tmpPath, _infPath);
                        }
                        byte[] okJson = Encoding.UTF8.GetBytes("{\"ok\":true}");
                        ctx.Response.StatusCode = 200;
                        ctx.Response.ContentType = "application/json; charset=utf-8";
                        ctx.Response.ContentLength64 = okJson.Length;
                        ctx.Response.OutputStream.Write(okJson, 0, okJson.Length);
                        ctx.Response.Close();
                        return;
                    }
                }

                if (path == "/api/shutdown" && string.Equals(ctx.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
                {
                    byte[] byeJson = Encoding.UTF8.GetBytes("{\"ok\":true,\"shuttingDown\":true}");
                    ctx.Response.StatusCode = 200;
                    ctx.Response.ContentType = "application/json; charset=utf-8";
                    ctx.Response.ContentLength64 = byeJson.Length;
                    ctx.Response.OutputStream.Write(byeJson, 0, byeJson.Length);
                    ctx.Response.Close();
                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        Thread.Sleep(220);
                        _running = false;
                        try
                        {
                            if (_browserProcess != null && !_browserProcess.HasExited)
                            {
                                _browserProcess.CloseMainWindow();
                                if (!_browserProcess.WaitForExit(1200))
                                {
                                    _browserProcess.Kill();
                                }
                            }
                        }
                        catch { }
                        StopServer();
                        try { Application.Exit(); } catch { }
                    });
                    return;
                }

                if (path == "/" || path == "/index.html")
                {
                    ctx.Response.StatusCode = 200;
                    ctx.Response.ContentType = "text/html; charset=utf-8";
                    ctx.Response.ContentLength64 = _htmlBytes.Length;
                    ctx.Response.OutputStream.Write(_htmlBytes, 0, _htmlBytes.Length);
                    ctx.Response.Close();
                    return;
                }

                ctx.Response.StatusCode = 404;
                ctx.Response.Close();
            }
            catch
            {
                try { ctx.Response.Abort(); } catch { }
            }
        }

        private static string FindChromiumBrowser()
        {
            string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
            string pf64 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) ?? "";
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) ?? "";
            string[] candidates = new string[]
            {
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(localApp) ? "" : Path.Combine(localApp, @"Google\Chrome\Application\chrome.exe")
            };
            for (int i = 0; i < candidates.Length; i++)
            {
                if (!string.IsNullOrEmpty(candidates[i]) && File.Exists(candidates[i]))
                {
                    return candidates[i];
                }
            }
            return null;
        }

        private static void LaunchUiSession(string url)
        {
            string chromium = FindChromiumBrowser();
            if (chromium != null)
            {
                string profileDir = Path.Combine(Path.GetTempPath(), "win11sim_prof_" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(profileDir);
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = chromium;
                    psi.Arguments = string.Format(
                        "--kiosk \"{0}\" --app=\"{0}\" --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check --noerrdialogs --disable-sync --disable-translate --disable-features=Translate,msAccountSync,ChromeWhatsNewUI --start-fullscreen",
                        url, profileDir);
                    psi.UseShellExecute = false;
                    using (Process p = Process.Start(psi))
                    {
                        _browserProcess = p;
                        if (p != null) p.WaitForExit();
                        _browserProcess = null;
                    }
                }
                finally
                {
                    try { Directory.Delete(profileDir, true); } catch { }
                }
                return;
            }

            // Fallback (e.g. Windows 7 with Firefox ESR only): open default browser + show clean control window
            try { Process.Start(url); } catch { }

            Application.EnableVisualStyles();
            Form hostForm = new Form();
            hostForm.Text = "محاكي Windows 11 — 1AS";
            hostForm.Size = new Size(420, 170);
            hostForm.StartPosition = FormStartPosition.CenterScreen;
            hostForm.RightToLeft = RightToLeft.Yes;
            hostForm.RightToLeftLayout = true;
            hostForm.FormBorderStyle = FormBorderStyle.FixedDialog;
            hostForm.MaximizeBox = false;

            Label lbl = new Label();
            lbl.Text = "الخادم المحلي للمحاكي يعمل حالياً.\nلا تغلق هذه النافذة أثناء عمل التلميذ في المتصفح.";
            lbl.Dock = DockStyle.Top;
            lbl.Height = 76;
            lbl.TextAlign = ContentAlignment.MiddleCenter;

            Button openBtn = new Button();
            openBtn.Text = "فتح نافذة المحاكي";
            openBtn.Location = new Point(220, 92);
            openBtn.Width = 150;
            openBtn.Height = 32;
            openBtn.Click += delegate { try { Process.Start(url); } catch { } };

            Button exitBtn = new Button();
            exitBtn.Text = "إنهاء وإغلاق المحاكي";
            exitBtn.Location = new Point(36, 92);
            exitBtn.Width = 160;
            exitBtn.Height = 32;
            exitBtn.Click += delegate { hostForm.Close(); };

            hostForm.Controls.Add(lbl);
            hostForm.Controls.Add(openBtn);
            hostForm.Controls.Add(exitBtn);
            Application.Run(hostForm);
        }

        private static void StopServer()
        {
            _running = false;
            try
            {
                if (_listener != null)
                {
                    _listener.Stop();
                    _listener.Close();
                }
            }
            catch { }
        }
    }
}
