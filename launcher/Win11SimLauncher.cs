/**
 * Windows 11 Arabic Educational Simulator - Portable Single-File Host
 * Pure User-Space TCP Loopback Server (WinSock) - ZERO Administrator Privileges Required.
 * Compatible with Windows 7 SP1 through Windows 11 (Both 32-bit & 64-bit).
 * Serves embedded simulator asset and manages sibling inf.dll configuration file.
 */
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace Win11SimHost
{
    [ComVisible(true)]
    public class NativeSimulatorBridge
    {
        private readonly string _infPath;

        public NativeSimulatorBridge(string infPath)
        {
            _infPath = infPath;
        }

        public string ReadInfBase64()
        {
            try
            {
                if (!File.Exists(_infPath)) return "";
                byte[] bytes = File.ReadAllBytes(_infPath);
                return Convert.ToBase64String(bytes);
            }
            catch
            {
                return "";
            }
        }

        public bool WriteInfBase64(string base64Data)
        {
            try
            {
                if (string.IsNullOrEmpty(base64Data)) return false;
                byte[] bytes = Convert.FromBase64String(base64Data);
                if (bytes.Length < 100 || bytes[0] != 0x57 || bytes[1] != 0x31 || bytes[2] != 0x31 || bytes[3] != 0x53 || bytes[4] != 0x02)
                {
                    return false;
                }
                string tmp = _infPath + ".tmp";
                File.WriteAllBytes(tmp, bytes);
                if (File.Exists(_infPath))
                {
                    File.Replace(tmp, _infPath, null);
                }
                else
                {
                    File.Move(tmp, _infPath);
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        public string SaveToDesktop(string filename, string contentBase64)
        {
            try
            {
                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                if (string.IsNullOrEmpty(desktopDir) || !Directory.Exists(desktopDir))
                {
                    string userProf = Environment.GetEnvironmentVariable("USERPROFILE");
                    if (!string.IsNullOrEmpty(userProf))
                    {
                        desktopDir = Path.Combine(userProf, "Desktop");
                    }
                }
                if (!Directory.Exists(desktopDir))
                {
                    desktopDir = AppDomain.CurrentDomain.BaseDirectory;
                }

                string safeName = SanitizeFileName(filename);
                if (string.IsNullOrEmpty(safeName)) safeName = "1AS_Report.html";
                string ext = Path.GetExtension(safeName);
                if (string.IsNullOrEmpty(ext) || ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                {
                    ext = ".html";
                    safeName = Path.GetFileNameWithoutExtension(safeName) + ".html";
                }
                string baseName = Path.GetFileNameWithoutExtension(safeName);

                string targetPath = Path.Combine(desktopDir, safeName);
                int counter = 1;
                while (File.Exists(targetPath))
                {
                    targetPath = Path.Combine(desktopDir, string.Format("{0}_{1}{2}", baseName, counter, ext));
                    counter++;
                }

                byte[] bytes = Convert.FromBase64String(contentBase64);
                File.WriteAllBytes(targetPath, bytes);
                return targetPath;
            }
            catch (Exception ex)
            {
                return "ERROR:" + ex.Message;
            }
        }

        public bool OpenFolder(string path)
        {
            try
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                {
                    Process.Start("explorer.exe", "/select,\"" + path + "\"");
                    return true;
                }
                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                if (string.IsNullOrEmpty(desktopDir) || !Directory.Exists(desktopDir))
                {
                    desktopDir = AppDomain.CurrentDomain.BaseDirectory;
                }
                string targetDir = (!string.IsNullOrEmpty(path) && Directory.Exists(path)) ? path : desktopDir;
                Process.Start("explorer.exe", "\"" + targetDir + "\"");
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool OpenFile(string path)
        {
            try
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(path);
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrEmpty(name)) return "";
            char[] invalids = Path.GetInvalidFileNameChars();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < name.Length; i++)
            {
                char c = name[i];
                bool bad = false;
                for (int j = 0; j < invalids.Length; j++)
                {
                    if (c == invalids[j]) { bad = true; break; }
                }
                if (bad || c == '/' || c == '\\') sb.Append('_');
                else sb.Append(c);
            }
            return sb.ToString().Trim();
        }
    }

    static class Program
    {
        private static byte[] _htmlBytes;
        private static string _exeDir;
        private static string _infPath;
        private static TcpListener _tcpListener;
        private static volatile bool _running = true;
        private static Process _browserProcess = null;
        private static string _tempProfileDir = null;
        private static DateTime _lastPingUtc = DateTime.UtcNow;
        private static volatile bool _hasReceivedPing = false;

        [STAThread]
        static int Main(string[] args)
        {
            _exeDir = AppDomain.CurrentDomain.BaseDirectory;
            _infPath = Path.Combine(_exeDir, "inf.dll");

            int requestedPort = 0;
            bool noBrowser = false;
            bool teacherMode = false;
            bool embeddedBrowser = false;

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
                else if (string.Equals(a, "--teacher", StringComparison.OrdinalIgnoreCase))
                {
                    teacherMode = true;
                }
                else if (string.Equals(a, "--embedded", StringComparison.OrdinalIgnoreCase))
                {
                    embeddedBrowser = true;
                }
            }

            // Single-instance protection: avoid duplicate conflicting server sockets & temp profiles
            bool createdNew = true;
            Mutex singleInstanceMutex = null;
            if (!noBrowser)
            {
                try
                {
                    singleInstanceMutex = new Mutex(true, "Local\\Win11SimHost_SingleInstance_1AS", out createdNew);
                    if (!createdNew)
                    {
                        return 0;
                    }
                }
                catch { }
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

            // Bind pure user-space TCP socket on 127.0.0.1 (No HttpListener / No http.sys / No Admin rights needed)
            int port = requestedPort;
            try
            {
                _tcpListener = new TcpListener(IPAddress.Loopback, port);
                _tcpListener.Start();
                port = ((IPEndPoint)_tcpListener.LocalEndpoint).Port;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Unable to open local user-space port on 127.0.0.1:\n" + ex.Message,
                    "Windows 11 Simulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 2;
            }

            string baseUrl = string.Format("http://127.0.0.1:{0}/", port);
            string launchUrl = teacherMode ? (baseUrl + "?teacher=1") : baseUrl;

            Thread serverThread = new Thread(ListenLoop);
            serverThread.IsBackground = true;
            serverThread.Start();

            if (noBrowser)
            {
                Console.WriteLine("WIN11_SIM_HOST_READY=" + baseUrl);
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

            if (embeddedBrowser)
            {
                LaunchEmbeddedWebBrowser(launchUrl);
            }
            else
            {
                LaunchUiSession(launchUrl);
            }

            StopServer();
            if (singleInstanceMutex != null)
            {
                try { singleInstanceMutex.ReleaseMutex(); } catch { }
                GC.KeepAlive(singleInstanceMutex);
            }
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

        private static void ListenLoop()
        {
            while (_running && _tcpListener != null)
            {
                try
                {
                    TcpClient client = _tcpListener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        HandleTcpClient((TcpClient)state);
                    }, client);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void HandleTcpClient(TcpClient client)
        {
            try
            {
                client.ReceiveTimeout = 15000;
                client.SendTimeout = 30000;
                NetworkStream stream = client.GetStream();

                // Read HTTP request header
                byte[] buffer = new byte[8192];
                int totalRead = 0;
                int headerEnd = -1;

                while (totalRead < buffer.Length)
                {
                    int n = stream.Read(buffer, totalRead, buffer.Length - totalRead);
                    if (n <= 0) break;
                    totalRead += n;
                    headerEnd = FindHeaderEnd(buffer, totalRead);
                    if (headerEnd != -1) break;
                }

                if (headerEnd == -1)
                {
                    client.Close();
                    return;
                }

                string headerText = Encoding.ASCII.GetString(buffer, 0, headerEnd);
                string[] lines = headerText.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                if (lines.Length == 0) { client.Close(); return; }

                string requestLine = lines[0];
                string[] parts = requestLine.Split(' ');
                if (parts.Length < 2) { client.Close(); return; }

                string method = parts[0].ToUpperInvariant();
                string fullPath = parts[1];
                string path = fullPath;
                int qIdx = path.IndexOf('?');
                if (qIdx >= 0) path = path.Substring(0, qIdx);

                _hasReceivedPing = true;
                _lastPingUtc = DateTime.UtcNow;

                int contentLength = 0;
                string headerContentType = null;
                string headerFilename = null;
                for (int i = 1; i < lines.Length; i++)
                {
                    string l = lines[i];
                    if (l.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase))
                    {
                        int.TryParse(l.Substring(15).Trim(), out contentLength);
                    }
                    else if (l.StartsWith("Content-Type:", StringComparison.OrdinalIgnoreCase))
                    {
                        headerContentType = l.Substring(13).Trim();
                    }
                    else if (l.StartsWith("X-Filename:", StringComparison.OrdinalIgnoreCase))
                    {
                        headerFilename = l.Substring(11).Trim();
                    }
                }

                byte[] body = new byte[0];
                if (contentLength > 0 && contentLength < 16 * 1024 * 1024)
                {
                    body = new byte[contentLength];
                    int alreadyReadBody = totalRead - headerEnd;
                    if (alreadyReadBody > 0)
                    {
                        int copyLen = Math.Min(alreadyReadBody, contentLength);
                        Array.Copy(buffer, headerEnd, body, 0, copyLen);
                    }
                    int bodyRead = Math.Min(alreadyReadBody, contentLength);
                    while (bodyRead < contentLength)
                    {
                        int n = stream.Read(body, bodyRead, contentLength - bodyRead);
                        if (n <= 0) break;
                        bodyRead += n;
                    }
                }

                // Handle CORS preflight
                if (method == "OPTIONS")
                {
                    SendResponse(stream, 204, "No Content", "text/plain", new byte[0], true);
                    client.Close();
                    return;
                }

                // API: INF sidecar
                if (path == "/api/inf")
                {
                    if (method == "GET")
                    {
                        if (!File.Exists(_infPath))
                        {
                            SendResponse(stream, 204, "No Content", "application/octet-stream", new byte[0], true);
                        }
                        else
                        {
                            byte[] infBytes = File.ReadAllBytes(_infPath);
                            SendResponse(stream, 200, "OK", "application/octet-stream", infBytes, true);
                        }
                        client.Close();
                        return;
                    }

                    if (method == "POST")
                    {
                        if (body.Length < 100 || body[0] != 0x57 || body[1] != 0x31 || body[2] != 0x31 || body[3] != 0x53 || body[4] != 0x02)
                        {
                            byte[] errJson = Encoding.UTF8.GetBytes("{\"ok\":false,\"error\":\"invalid_envelope\"}");
                            SendResponse(stream, 400, "Bad Request", "application/json; charset=utf-8", errJson, true);
                            client.Close();
                            return;
                        }

                        try
                        {
                            if (File.Exists(_infPath))
                            {
                                File.Delete(_infPath);
                            }
                        }
                        catch { }

                        File.WriteAllBytes(_infPath, body);

                        byte[] okJson = Encoding.UTF8.GetBytes("{\"ok\":true}");
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", okJson, true);
                        client.Close();
                        return;
                    }
                }

                // API: Ping Heartbeat
                if (path == "/api/ping")
                {
                    _hasReceivedPing = true;
                    _lastPingUtc = DateTime.UtcNow;
                    byte[] pingOk = Encoding.UTF8.GetBytes("{\"ok\":true}");
                    SendResponse(stream, 200, "OK", "application/json; charset=utf-8", pingOk, true);
                    client.Close();
                    return;
                }

                // API: Goodbye Beacon on Window Close
                if (path == "/api/goodbye")
                {
                    byte[] byeOk = Encoding.UTF8.GetBytes("{\"ok\":true}");
                    SendResponse(stream, 200, "OK", "application/json; charset=utf-8", byeOk, true);
                    client.Close();

                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        Thread.Sleep(800);
                        _running = false;
                        StopServer();
                        try { Application.Exit(); } catch { }
                    });
                    return;
                }

                // API: Shutdown
                if (path == "/api/shutdown" && method == "POST")
                {
                    byte[] byeJson = Encoding.UTF8.GetBytes("{\"ok\":true,\"shuttingDown\":true}");
                    SendResponse(stream, 200, "OK", "application/json; charset=utf-8", byeJson, true);
                    client.Close();

                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        Thread.Sleep(200);
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

                // API: Save to Desktop (Zero-Privilege Classroom Auto-Save)
                if (path == "/api/save-to-desktop" && method == "POST")
                {
                    try
                    {
                        string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                        if (string.IsNullOrEmpty(desktopDir) || !Directory.Exists(desktopDir))
                        {
                            string userProf = Environment.GetEnvironmentVariable("USERPROFILE");
                            if (!string.IsNullOrEmpty(userProf))
                            {
                                desktopDir = Path.Combine(userProf, "Desktop");
                            }
                        }
                        if (!Directory.Exists(desktopDir))
                        {
                            desktopDir = _exeDir;
                        }

                        string rawBody = Encoding.UTF8.GetString(body);
                        string filename = ExtractJsonStringValue(rawBody, "filename");
                        if (string.IsNullOrEmpty(filename) && !string.IsNullOrEmpty(headerFilename))
                        {
                            filename = headerFilename;
                        }
                        if (string.IsNullOrEmpty(filename))
                        {
                            filename = "1AS_Report.html";
                        }

                        string safeName = SanitizeFileName(filename);
                        if (string.IsNullOrEmpty(safeName)) safeName = "1AS_Report.html";
                        string ext = Path.GetExtension(safeName);
                        if (string.IsNullOrEmpty(ext)) ext = ".html";
                        string baseName = Path.GetFileNameWithoutExtension(safeName);

                        string targetPath = Path.Combine(desktopDir, safeName);
                        int counter = 1;
                        while (File.Exists(targetPath))
                        {
                            targetPath = Path.Combine(desktopDir, string.Format("{0}_{1}{2}", baseName, counter, ext));
                            counter++;
                        }

                        byte[] fileBytes = null;
                        string b64 = ExtractJsonStringValue(rawBody, "base64");
                        if (!string.IsNullOrEmpty(b64))
                        {
                            try { fileBytes = Convert.FromBase64String(b64); } catch { }
                        }
                        string htmlStr = ExtractJsonStringValue(rawBody, "html");
                        if (fileBytes == null)
                        {
                            if (!string.IsNullOrEmpty(htmlStr))
                            {
                                fileBytes = Encoding.UTF8.GetBytes(htmlStr);
                            }
                            else if (headerContentType != null && (headerContentType.Contains("html") || headerContentType.Contains("octet-stream")))
                            {
                                fileBytes = body;
                            }
                            else
                            {
                                fileBytes = body;
                            }
                        }

                        if (ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                        {
                            bool pdfDone = false;
                            if (string.IsNullOrEmpty(htmlStr) && fileBytes != null)
                            {
                                try { htmlStr = Encoding.UTF8.GetString(fileBytes); } catch { }
                            }

                            string chromium = FindChromiumBrowser();
                            if (!string.IsNullOrEmpty(chromium) && File.Exists(chromium) && !string.IsNullOrEmpty(htmlStr))
                            {
                                string tmpHtml = Path.Combine(Path.GetTempPath(), "print_doc_" + Guid.NewGuid().ToString("N") + ".html");
                                try
                                {
                                    File.WriteAllText(tmpHtml, htmlStr, Encoding.UTF8);
                                    string fileUrl = "file:///" + tmpHtml.Replace('\\', '/');
                                    ProcessStartInfo pPsi = new ProcessStartInfo();
                                    pPsi.FileName = chromium;
                                    pPsi.Arguments = string.Format(
                                        "--headless=new --disable-gpu --no-sandbox --run-all-compositor-stages-before-draw --print-to-pdf=\"{0}\" \"{1}\"",
                                        targetPath, fileUrl);
                                    pPsi.UseShellExecute = false;
                                    pPsi.CreateNoWindow = true;
                                    using (Process p = Process.Start(pPsi))
                                    {
                                        if (p != null)
                                        {
                                            p.WaitForExit(8000);
                                            if (File.Exists(targetPath) && new FileInfo(targetPath).Length > 1000)
                                            {
                                                try
                                                {
                                                    byte[] header = new byte[4];
                                                    using (FileStream fs = File.OpenRead(targetPath))
                                                    {
                                                        if (fs.Read(header, 0, 4) == 4 &&
                                                            header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) // %PDF
                                                        {
                                                            pdfDone = true;
                                                        }
                                                    }
                                                }
                                                catch { }
                                            }
                                        }
                                    }
                                }
                                catch { }
                                finally
                                {
                                    try { File.Delete(tmpHtml); } catch { }
                                }
                            }

                            if (!pdfDone)
                            {
                                try { if (File.Exists(targetPath)) File.Delete(targetPath); } catch { }
                                targetPath = Path.Combine(desktopDir, baseName + ".html");
                                File.WriteAllBytes(targetPath, fileBytes ?? (htmlStr != null ? Encoding.UTF8.GetBytes(htmlStr) : new byte[0]));
                            }
                        }
                        else
                        {
                            File.WriteAllBytes(targetPath, fileBytes ?? new byte[0]);
                        }

                        string finalFilename = Path.GetFileName(targetPath);
                        string escapedPath = targetPath.Replace("\\", "\\\\").Replace("\"", "\\\"");
                        string escapedDir = desktopDir.Replace("\\", "\\\\").Replace("\"", "\\\"");
                        string escapedName = finalFilename.Replace("\\", "\\\\").Replace("\"", "\\\"");

                        string resJson = string.Format(
                            "{{\"ok\":true,\"filename\":\"{0}\",\"path\":\"{1}\",\"desktopDir\":\"{2}\"}}",
                            escapedName, escapedPath, escapedDir);

                        byte[] resBytes = Encoding.UTF8.GetBytes(resJson);
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", resBytes, true);
                        client.Close();
                        return;
                    }
                    catch (Exception ex)
                    {
                        string errJson = string.Format("{{\"ok\":false,\"error\":\"{0}\"}}", ex.Message.Replace("\"", "'"));
                        SendResponse(stream, 500, "Internal Server Error", "application/json; charset=utf-8", Encoding.UTF8.GetBytes(errJson), true);
                        client.Close();
                        return;
                    }
                }

                // API: Open Folder in Explorer
                if (path == "/api/open-folder" && method == "POST")
                {
                    try
                    {
                        string rawBody = Encoding.UTF8.GetString(body);
                        string targetPath = ExtractJsonStringValue(rawBody, "path");
                        string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                        if (string.IsNullOrEmpty(desktopDir) || !Directory.Exists(desktopDir))
                        {
                            string userProf = Environment.GetEnvironmentVariable("USERPROFILE");
                            if (!string.IsNullOrEmpty(userProf))
                            {
                                desktopDir = Path.Combine(userProf, "Desktop");
                            }
                        }
                        if (!Directory.Exists(desktopDir))
                        {
                            desktopDir = _exeDir;
                        }

                        if (!string.IsNullOrEmpty(targetPath) && File.Exists(targetPath))
                        {
                            Process.Start("explorer.exe", "/select,\"" + targetPath + "\"");
                        }
                        else if (!string.IsNullOrEmpty(targetPath) && Directory.Exists(targetPath))
                        {
                            Process.Start("explorer.exe", "\"" + targetPath + "\"");
                        }
                        else
                        {
                            Process.Start("explorer.exe", "\"" + desktopDir + "\"");
                        }

                        byte[] okBytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", okBytes, true);
                        client.Close();
                        return;
                    }
                    catch (Exception ex)
                    {
                        string errJson = string.Format("{{\"ok\":false,\"error\":\"{0}\"}}", ex.Message.Replace("\"", "'"));
                        SendResponse(stream, 500, "Internal Server Error", "application/json; charset=utf-8", Encoding.UTF8.GetBytes(errJson), true);
                        client.Close();
                        return;
                    }
                }

                // API: Open File in Default App (e.g. Generated PDF Reader)
                if (path == "/api/open-file" && method == "POST")
                {
                    try
                    {
                        string rawBody = Encoding.UTF8.GetString(body);
                        string targetPath = ExtractJsonStringValue(rawBody, "path");
                        if (!string.IsNullOrEmpty(targetPath) && File.Exists(targetPath))
                        {
                            ProcessStartInfo psi = new ProcessStartInfo();
                            psi.FileName = targetPath;
                            psi.UseShellExecute = true;
                            Process.Start(psi);
                        }

                        byte[] okBytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", okBytes, true);
                        client.Close();
                        return;
                    }
                    catch (Exception ex)
                    {
                        string errJson = string.Format("{{\"ok\":false,\"error\":\"{0}\"}}", ex.Message.Replace("\"", "'"));
                        SendResponse(stream, 500, "Internal Server Error", "application/json; charset=utf-8", Encoding.UTF8.GetBytes(errJson), true);
                        client.Close();
                        return;
                    }
                }

                // Root & HTML asset
                if (path == "/" || path == "/index.html")
                {
                    SendResponse(stream, 200, "OK", "text/html; charset=utf-8", _htmlBytes, true);
                    client.Close();
                    return;
                }

                // Fallback 404
                byte[] notFound = Encoding.UTF8.GetBytes("Not Found");
                SendResponse(stream, 404, "Not Found", "text/plain", notFound, true);
                client.Close();
            }
            catch
            {
                try { client.Close(); } catch { }
            }
        }

        private static int FindHeaderEnd(byte[] buf, int len)
        {
            for (int i = 0; i <= len - 4; i++)
            {
                if (buf[i] == '\r' && buf[i + 1] == '\n' && buf[i + 2] == '\r' && buf[i + 3] == '\n')
                {
                    return i + 4;
                }
            }
            return -1;
        }

        private static void SendResponse(NetworkStream stream, int statusCode, string statusReason, string contentType, byte[] data, bool cors)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("HTTP/1.1 {0} {1}\r\n", statusCode, statusReason);
            sb.AppendFormat("Content-Type: {0}\r\n", contentType);
            sb.AppendFormat("Content-Length: {0}\r\n", data != null ? data.Length : 0);
            sb.Append("Cache-Control: no-store, no-cache, must-revalidate\r\n");
            sb.Append("Connection: close\r\n");
            if (cors)
            {
                sb.Append("Access-Control-Allow-Origin: *\r\n");
                sb.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
                sb.Append("Access-Control-Allow-Headers: *\r\n");
            }
            sb.Append("\r\n");

            byte[] headerBytes = Encoding.ASCII.GetBytes(sb.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (data != null && data.Length > 0)
            {
                int offset = 0;
                int chunkSize = 65536;
                while (offset < data.Length)
                {
                    int toWrite = Math.Min(chunkSize, data.Length - offset);
                    stream.Write(data, offset, toWrite);
                    offset += toWrite;
                }
            }
            stream.Flush();
        }

        private static string FindChromiumBrowser()
        {
            string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
            string pf64 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) ?? "";
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) ?? "";

            string[] candidates = new string[]
            {
                // Microsoft Edge
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Microsoft\Edge\Application\msedge.exe"),
                // Google Chrome
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(localApp) ? "" : Path.Combine(localApp, @"Google\Chrome\Application\chrome.exe"),
                // Portable Browsers in simulator folder
                Path.Combine(_exeDir, @"chrome-win\chrome.exe"),
                Path.Combine(_exeDir, @"browser\chrome.exe"),
                Path.Combine(_exeDir, @"App\Chrome\chrome.exe"),
                // Brave
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                // Opera
                string.IsNullOrEmpty(localApp) ? "" : Path.Combine(localApp, @"Programs\Opera\launcher.exe")
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

        private static string FindFirefoxBrowser()
        {
            string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
            string pf64 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) ?? "";

            string[] candidates = new string[]
            {
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Mozilla Firefox\firefox.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Mozilla Firefox\firefox.exe"),
                Path.Combine(_exeDir, @"firefox\firefox.exe")
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
                _tempProfileDir = Path.Combine(Path.GetTempPath(), "win11sim_prof_" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(_tempProfileDir);
                try
                {
                    try
                    {
                        string defaultDir = Path.Combine(_tempProfileDir, "Default");
                        Directory.CreateDirectory(defaultDir);
                        string prefsFile = Path.Combine(defaultDir, "Preferences");
                        string prefsJson = "{" +
                            "\"safebrowsing\":{\"enabled\":false,\"enhanced\":false}," +
                            "\"smartscreen\":{\"enabled\":false}," +
                            "\"download\":{\"prompt_for_download\":false,\"default_directory\":\"" + _exeDir.Replace("\\", "\\\\") + "\"}," +
                            "\"profile\":{\"password_manager_enabled\":false}," +
                            "\"translate\":{\"enabled\":false}" +
                        "}";
                        File.WriteAllText(prefsFile, prefsJson, Encoding.UTF8);
                    }
                    catch { }

                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = chromium;
                    psi.Arguments = string.Format(
                        "--app=\"{0}\" " +
                        "--user-data-dir=\"{1}\" " +
                        "--no-first-run " +
                        "--no-default-browser-check " +
                        "--noerrdialogs " +
                        "--disable-sync " +
                        "--disable-translate " +
                        "--disable-notifications " +
                        "--disable-popup-blocking " +
                        "--disable-client-side-phishing-detection " +
                        "--safebrowsing-disable-download-protection " +
                        "--safebrowsing-disable-auto-update " +
                        "--safebrowsing-disable-extension-blacklist " +
                        "--disable-component-update " +
                        "--proxy-server=\"direct://\" " +
                        "--proxy-bypass-list=\"*\" " +
                        "--disable-features=msSmartScreenProtection,msSmartScreenPua,msSmartScreenPhishing,msDefenderSmartScreen,ScarewareBlockerProtectionEnabled,ScarewareBlockerBlocksDetectedSitesEnabled,msScarewareBlocker,msEdgeScarewareBlocker,SafetyHub,msEdgeStartupBoost,msStartupBoost,msPreemptiveLaunch,msEdgePreemptiveLaunch,Translate,msAccountSync,ChromeWhatsNewUI " +
                        "--disable-background-mode " +
                        "--disable-backgrounding-occluded-windows " +
                        "--new-window " +
                        "--start-maximized",
                        url, _tempProfileDir);
                    psi.UseShellExecute = false;

                    Process p = Process.Start(psi);
                    _browserProcess = p;

                    DateTime launchTime = DateTime.UtcNow;
                    _lastPingUtc = DateTime.UtcNow;
                    _hasReceivedPing = false;

                    // Watchdog loop: Keeps loopback server alive even if browser launches via a short-lived bootstrap process
                    while (_running)
                    {
                        if (!_running) break;

                        // Check if primary process was directly tracked and exited normally after active use
                        if (p != null && p.HasExited)
                        {
                            TimeSpan totalRun = DateTime.UtcNow - launchTime;
                            if (totalRun.TotalSeconds > 3 && _hasReceivedPing)
                            {
                                TimeSpan sincePing = DateTime.UtcNow - _lastPingUtc;
                                if (sincePing.TotalSeconds > 4)
                                {
                                    break;
                                }
                            }
                        }

                        // Heartbeat watchdog
                        if (_hasReceivedPing)
                        {
                            TimeSpan idle = DateTime.UtcNow - _lastPingUtc;
                            if (idle.TotalSeconds > 10)
                            {
                                break;
                            }
                        }
                        else
                        {
                            // Generous 60-second grace period for browser window to launch and fetch page
                            TimeSpan waiting = DateTime.UtcNow - launchTime;
                            if (waiting.TotalSeconds > 60)
                            {
                                break;
                            }
                        }

                        Thread.Sleep(500);
                    }
                }
                catch { }
                return;
            }

            string firefox = FindFirefoxBrowser();
            if (firefox != null)
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = firefox;
                    psi.Arguments = string.Format("\"{0}\"", url);
                    psi.UseShellExecute = false;
                    using (Process p = Process.Start(psi))
                    {
                        _browserProcess = p;
                        if (p != null) p.WaitForExit();
                        _browserProcess = null;
                    }
                    return;
                }
                catch { }
            }

            // Fallback: Launch default browser & show companion window
            try { Process.Start(url); } catch { }

            Application.EnableVisualStyles();
            Form hostForm = new Form();
            hostForm.Text = "محاكي لوحة التحكم Windows 11 — 1AS";
            hostForm.Size = new Size(460, 180);
            hostForm.StartPosition = FormStartPosition.CenterScreen;
            hostForm.RightToLeft = RightToLeft.Yes;
            hostForm.RightToLeftLayout = true;
            hostForm.FormBorderStyle = FormBorderStyle.FixedDialog;
            hostForm.MaximizeBox = false;

            Label lbl = new Label();
            lbl.Text = "خادم المحاكي المحلي قيد التشغيل (بدون أي صلاحيات إدارية).\nلا تغلق هذه النافذة أثناء عمل التلميذ.";
            lbl.Dock = DockStyle.Top;
            lbl.Height = 72;
            lbl.TextAlign = ContentAlignment.MiddleCenter;
            lbl.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            Button openBtn = new Button();
            openBtn.Text = "فتح نافذة المحاكي";
            openBtn.Location = new Point(240, 92);
            openBtn.Width = 170;
            openBtn.Height = 34;
            openBtn.Click += delegate { try { Process.Start(url); } catch { } };

            Button exitBtn = new Button();
            exitBtn.Text = "إنهاء وإغلاق المحاكي";
            exitBtn.Location = new Point(40, 92);
            exitBtn.Width = 170;
            exitBtn.Height = 34;
            exitBtn.Click += delegate { hostForm.Close(); };

            hostForm.Controls.Add(lbl);
            hostForm.Controls.Add(openBtn);
            hostForm.Controls.Add(exitBtn);
            Application.Run(hostForm);
        }

        private static void LaunchEmbeddedWebBrowser(string url)
        {
            Application.EnableVisualStyles();
            Form form = new Form();
            form.Text = "محاكي لوحة التحكم Windows 11 — 1AS";
            form.WindowState = FormWindowState.Maximized;
            form.FormBorderStyle = FormBorderStyle.Sizable;
            form.TopMost = false;

            WebBrowser wb = new WebBrowser();
            wb.Dock = DockStyle.Fill;
            wb.ScriptErrorsSuppressed = true;
            wb.IsWebBrowserContextMenuEnabled = false;
            wb.ObjectForScripting = new NativeSimulatorBridge(_infPath);

            form.Controls.Add(wb);
            form.Load += delegate { wb.Navigate(url); };
            Application.Run(form);
        }

        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrEmpty(name)) return "";
            char[] invalids = Path.GetInvalidFileNameChars();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < name.Length; i++)
            {
                char c = name[i];
                bool bad = false;
                for (int j = 0; j < invalids.Length; j++)
                {
                    if (c == invalids[j]) { bad = true; break; }
                }
                if (bad || c == '/' || c == '\\') sb.Append('_');
                else sb.Append(c);
            }
            return sb.ToString().Trim();
        }

        private static string ExtractJsonStringValue(string json, string key)
        {
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(key)) return "";
            string needle = "\"" + key + "\"";
            int idx = json.IndexOf(needle, StringComparison.OrdinalIgnoreCase);
            if (idx == -1) return "";
            int colonIdx = json.IndexOf(':', idx + needle.Length);
            if (colonIdx == -1) return "";
            int quoteStart = json.IndexOf('"', colonIdx + 1);
            if (quoteStart == -1) return "";
            StringBuilder sb = new StringBuilder();
            bool escaped = false;
            for (int i = quoteStart + 1; i < json.Length; i++)
            {
                char c = json[i];
                if (escaped)
                {
                    if (c == 'n') sb.Append('\n');
                    else if (c == 'r') sb.Append('\r');
                    else if (c == 't') sb.Append('\t');
                    else if (c == '"') sb.Append('"');
                    else if (c == '\\') sb.Append('\\');
                    else if (c == '/') sb.Append('/');
                    else sb.Append(c);
                    escaped = false;
                }
                else if (c == '\\')
                {
                    escaped = true;
                }
                else if (c == '"')
                {
                    return sb.ToString();
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private static void StopServer()
        {
            _running = false;
            try
            {
                if (_tcpListener != null)
                {
                    _tcpListener.Stop();
                }
            }
            catch { }

            if (!string.IsNullOrEmpty(_tempProfileDir) && Directory.Exists(_tempProfileDir))
            {
                try
                {
                    Directory.Delete(_tempProfileDir, true);
                }
                catch { }
                _tempProfileDir = null;
            }
        }
    }
}
