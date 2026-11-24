/**
 * Windows 11 Arabic Educational Simulator - Portable Single-File Host
 * Pure User-Space TCP Loopback Server (WinSock) - ZERO Administrator Privileges Required.
 * Compatible with Windows 7 SP1 through Windows 11 (Both 32-bit & 64-bit).
 * Serves embedded simulator asset and manages sibling inf.dll configuration file.
 */
using System;
using System.Collections.Generic;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
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
                string target = Program.ResolveInfDllPath();
                if (!File.Exists(target)) return "";
                byte[] bytes = File.ReadAllBytes(target);
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
                string target = Program.ResolveInfDllPath();
                string tmp = target + ".tmp";
                File.WriteAllBytes(tmp, bytes);
                if (File.Exists(target))
                {
                    File.Replace(tmp, target, null);
                }
                else
                {
                    File.Move(tmp, target);
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
                if (string.IsNullOrEmpty(safeName)) safeName = "1AS_Report.pdf";
                string ext = Path.GetExtension(safeName);
                if (string.IsNullOrEmpty(ext))
                {
                    ext = ".pdf";
                    safeName = safeName + ".pdf";
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

                if (ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                {
                    if (bytes != null && bytes.Length >= 4 &&
                        bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46)
                    {
                        File.WriteAllBytes(targetPath, bytes);
                        return targetPath;
                    }

                    string htmlStr = Encoding.UTF8.GetString(bytes);
                    string chromium = Program.FindChromiumBrowser();
                    if (!string.IsNullOrEmpty(chromium) && File.Exists(chromium))
                    {
                        string tmpHtml = Path.Combine(Path.GetTempPath(), "print_doc_" + Guid.NewGuid().ToString("N") + ".html");
                        try
                        {
                            File.WriteAllText(tmpHtml, htmlStr, Encoding.UTF8);
                            string fileUrl = "file:///" + tmpHtml.Replace('\\', '/');
                            string[] headlessVariants = new string[] { "--headless=new", "--headless" };
                            for (int v = 0; v < headlessVariants.Length; v++)
                            {
                                string tmpProf = Path.Combine(Path.GetTempPath(), "print_prof_" + Guid.NewGuid().ToString("N"));
                                try
                                {
                                    ProcessStartInfo pPsi = new ProcessStartInfo();
                                    pPsi.FileName = chromium;
                                    pPsi.Arguments = string.Format(
                                        "{0} --disable-gpu --no-sandbox --no-pdf-header-footer --user-data-dir=\"{1}\" --run-all-compositor-stages-before-draw --print-to-pdf=\"{2}\" \"{3}\"",
                                        headlessVariants[v], tmpProf, targetPath, fileUrl);
                                    pPsi.UseShellExecute = false;
                                    pPsi.CreateNoWindow = true;
                                    using (Process p = Process.Start(pPsi))
                                    {
                                        if (p != null) p.WaitForExit(15000);
                                    }
                                    if (File.Exists(targetPath) && new FileInfo(targetPath).Length > 100)
                                    {
                                        try
                                        {
                                            byte[] header = new byte[4];
                                            using (FileStream fs = File.OpenRead(targetPath))
                                            {
                                                if (fs.Read(header, 0, 4) == 4 &&
                                                    header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) // %PDF
                                                {
                                                    return targetPath;
                                                }
                                            }
                                        }
                                        catch { }
                                    }
                                }
                                catch { }
                                finally
                                {
                                    try { if (Directory.Exists(tmpProf)) Directory.Delete(tmpProf, true); } catch { }
                                }
                            }
                        }
                        catch { }
                        finally
                        {
                            try { File.Delete(tmpHtml); } catch { }
                        }
                    }

                    // Strict PDF requirement: NEVER fallback to .html
                    Program.GenerateNativeReportPdf(targetPath, htmlStr); return targetPath;
                }

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
                if (!string.IsNullOrEmpty(path))
                {
                    if (File.Exists(path))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo(path);
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                        return true;
                    }
                    string altPath = path.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
                        ? Path.ChangeExtension(path, ".html")
                        : Path.ChangeExtension(path, ".pdf");
                    if (File.Exists(altPath))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo(altPath);
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                        return true;
                    }
                    string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    if (Directory.Exists(desktopDir))
                    {
                        Process.Start("explorer.exe", "\"" + desktopDir + "\"");
                        return true;
                    }
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

    public class SplashForm : Form
    {
        private ProgressBar _progressBar;
        private Label _lblStatus;

        public SplashForm()
        {
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Size = new Size(520, 240);
            this.TopMost = true;
            this.ShowInTaskbar = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Windows 11 Dark Slate
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;

            Panel pnlHeader = new Panel();
            pnlHeader.Dock = DockStyle.Top;
            pnlHeader.Height = 110;
            pnlHeader.BackColor = Color.FromArgb(0, 103, 192); // Win11 Accent Blue
            pnlHeader.Padding = new Padding(18, 14, 18, 10);

            Label lblApp = new Label();
            lblApp.Text = "محاكي لوحة التحكم وإعدادات النظام — Windows 11";
            lblApp.Font = new Font("Segoe UI", 13.5f, FontStyle.Bold);
            lblApp.ForeColor = Color.White;
            lblApp.Dock = DockStyle.Top;
            lblApp.Height = 36;

            Label lblSub = new Label();
            lblSub.Text = "السنة الأولى ثانوي (1AS) — مادة الإعلام الآلي\nالمجال 1: بيئة التعامل مع الحاسوب | خادم محلي بدون أي صلاحيات إدارية";
            lblSub.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblSub.ForeColor = Color.FromArgb(224, 242, 254);
            lblSub.Dock = DockStyle.Fill;

            pnlHeader.Controls.Add(lblSub);
            pnlHeader.Controls.Add(lblApp);

            Panel pnlBody = new Panel();
            pnlBody.Dock = DockStyle.Fill;
            pnlBody.BackColor = Color.FromArgb(15, 23, 42);
            pnlBody.Padding = new Padding(24, 20, 24, 20);

            _lblStatus = new Label();
            _lblStatus.Text = "جاري تهيئة بيئة المحاكاة والتحقق من الموارد...";
            _lblStatus.Font = new Font("Segoe UI", 10.5f, FontStyle.Regular);
            _lblStatus.ForeColor = Color.FromArgb(241, 245, 249);
            _lblStatus.Dock = DockStyle.Top;
            _lblStatus.Height = 36;

            _progressBar = new ProgressBar();
            _progressBar.Dock = DockStyle.Bottom;
            _progressBar.Height = 14;
            _progressBar.Minimum = 0;
            _progressBar.Maximum = 100;
            _progressBar.Value = 15;
            _progressBar.Style = ProgressBarStyle.Continuous;

            pnlBody.Controls.Add(_lblStatus);
            pnlBody.Controls.Add(_progressBar);

            this.Controls.Add(pnlBody);
            this.Controls.Add(pnlHeader);

            this.Paint += delegate(object sender, PaintEventArgs e)
            {
                using (Pen p = new Pen(Color.FromArgb(0, 103, 192), 2))
                {
                    e.Graphics.DrawRectangle(p, 0, 0, this.Width - 1, this.Height - 1);
                }
            };
        }

        private delegate void ProgressInvoker(int val, string text);
        public void SetProgress(int val, string text)
        {
            if (this.InvokeRequired)
            {
                try { this.BeginInvoke(new ProgressInvoker(SetProgress), val, text); } catch { }
                return;
            }
            if (_progressBar != null)
            {
                _progressBar.Value = Math.Max(0, Math.Min(100, val));
            }
            if (_lblStatus != null && !string.IsNullOrEmpty(text))
            {
                _lblStatus.Text = text;
            }
        }

        private delegate void CloseInvoker();
        public void CloseForm()
        {
            if (this.InvokeRequired)
            {
                try { this.BeginInvoke(new CloseInvoker(CloseForm)); } catch { }
                return;
            }
            this.Close();
        }
    }

    public static class SplashScreen
    {
        private static SplashForm _form;
        private static Thread _thread;
        private static readonly object _lock = new object();

        public static void Show()
        {
            lock (_lock)
            {
                if (_thread != null) return;
                _thread = new Thread(Run);
                _thread.IsBackground = true;
                _thread.SetApartmentState(ApartmentState.STA);
                _thread.Start();
            }
        }

        private static void Run()
        {
            _form = new SplashForm();
            Application.Run(_form);
        }

        public static void Update(int percent, string message)
        {
            try
            {
                if (_form != null && !_form.IsDisposed)
                {
                    _form.SetProgress(percent, message);
                }
            }
            catch { }
        }

        public static void Close()
        {
            try
            {
                if (_form != null && !_form.IsDisposed)
                {
                    _form.CloseForm();
                }
            }
            catch { }
        }
    }

    static class Program
    {
        public static byte[] BuildPdfFromJpeg(byte[] jpegBytes, int width, int height)
        {
            double a4W = 595.28;
            double a4H = 841.89;

            byte[] header = Encoding.ASCII.GetBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
            List<long> offsets = new List<long>();
            offsets.Add(0);

            using (MemoryStream ms = new MemoryStream())
            {
                ms.Write(header, 0, header.Length);

                offsets.Add(ms.Position);
                byte[] o1 = Encoding.ASCII.GetBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
                ms.Write(o1, 0, o1.Length);

                offsets.Add(ms.Position);
                byte[] o2 = Encoding.ASCII.GetBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
                ms.Write(o2, 0, o2.Length);

                offsets.Add(ms.Position);
                string o3Str = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {0:0.00} {1:0.00}] /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n",
                    a4W, a4H);
                byte[] o3 = Encoding.ASCII.GetBytes(o3Str);
                ms.Write(o3, 0, o3.Length);

                offsets.Add(ms.Position);
                string imgDict = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "4 0 obj\n<< /Type /XObject /Subtype /Image /Width {0} /Height {1} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {2} >>\nstream\n",
                    width, height, jpegBytes.Length);
                byte[] imgDictBytes = Encoding.ASCII.GetBytes(imgDict);
                ms.Write(imgDictBytes, 0, imgDictBytes.Length);
                ms.Write(jpegBytes, 0, jpegBytes.Length);
                byte[] imgFoot = Encoding.ASCII.GetBytes("\nendstream\nendobj\n");
                ms.Write(imgFoot, 0, imgFoot.Length);

                offsets.Add(ms.Position);
                string streamContent = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "q\n{0:0.00} 0 0 {1:0.00} 0 0 cm\n/Im1 Do\nQ\n",
                    a4W, a4H);
                byte[] streamBytes = Encoding.ASCII.GetBytes(streamContent);
                string o5Str = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "5 0 obj\n<< /Length {0} >>\nstream\n{1}endstream\nendobj\n",
                    streamBytes.Length, streamContent);
                byte[] o5 = Encoding.ASCII.GetBytes(o5Str);
                ms.Write(o5, 0, o5.Length);

                long xrefOffset = ms.Position;
                StringBuilder xref = new StringBuilder();
                xref.Append("xref\n0 6\n0000000000 65535 f \n");
                for (int i = 1; i <= 5; i++)
                {
                    xref.AppendFormat("{0:D10} 00000 n \n", offsets[i]);
                }
                xref.AppendFormat("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{0}\n%%EOF\n", xrefOffset);
                byte[] xrefBytes = Encoding.ASCII.GetBytes(xref.ToString());
                ms.Write(xrefBytes, 0, xrefBytes.Length);

                return ms.ToArray();
            }
        }

        private static string CleanHtml(string str)
        {
            if (string.IsNullOrEmpty(str)) return "";
            string c = Regex.Replace(str, @"<[^>]+>", " ");
            c = c.Replace("&nbsp;", " ").Replace("&amp;", "&").Replace("&lt;", "<").Replace("&gt;", ">").Replace("&quot;", "\"");
            return Regex.Replace(c, @"\s+", " ").Trim();
        }

        private class NativeReportRow
        {
            public string Num = "";
            public string Title = "";
            public string Type = "";
            public string Status = "";
            public string Attempts = "";
            public string Max = "";
            public string Earned = "";
            public string Deduct = "";
            public string Notes = "";
            public bool IsFooter = false;
            public bool IsQuiz = false;
            public bool IsPenalty = false;
        }

        private class NativeMathStep
        {
            public string Num = "";
            public string Label = "";
            public string Value = "";
            public string Sub = "";
        }

        public static bool GenerateNativeReportPdf(string targetPath, string html)
        {
            try
            {
                using (Bitmap bmp = new Bitmap(1240, 1754))
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.Clear(Color.White);
                    g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
                    g.SmoothingMode = SmoothingMode.AntiAlias;

                    // Double Border
                    using (Pen pen = new Pen(Color.FromArgb(30, 58, 138), 3.5f))
                    {
                        g.DrawRectangle(pen, 40, 40, 1160, 1674);
                    }
                    using (Pen pen2 = new Pen(Color.FromArgb(148, 163, 184), 1.2f))
                    {
                        g.DrawRectangle(pen2, 46, 46, 1148, 1662);
                    }

                    StringFormat rtlCenter = new StringFormat();
                    rtlCenter.Alignment = StringAlignment.Center;
                    rtlCenter.LineAlignment = StringAlignment.Center;
                    rtlCenter.FormatFlags = StringFormatFlags.DirectionRightToLeft;

                    StringFormat rtlRight = new StringFormat();
                    rtlRight.Alignment = StringAlignment.Near;
                    rtlRight.LineAlignment = StringAlignment.Center;
                    rtlRight.FormatFlags = StringFormatFlags.DirectionRightToLeft;

                    StringFormat rtlNearTop = new StringFormat();
                    rtlNearTop.Alignment = StringAlignment.Near;
                    rtlNearTop.LineAlignment = StringAlignment.Near;
                    rtlNearTop.FormatFlags = StringFormatFlags.DirectionRightToLeft;

                    StringFormat ltrCenter = new StringFormat();
                    ltrCenter.Alignment = StringAlignment.Center;
                    ltrCenter.LineAlignment = StringAlignment.Center;

                    StringFormat ltrRight = new StringFormat();
                    ltrRight.Alignment = StringAlignment.Far;
                    ltrRight.LineAlignment = StringAlignment.Center;

                    StringFormat ltrLeft = new StringFormat();
                    ltrLeft.Alignment = StringAlignment.Near;
                    ltrLeft.LineAlignment = StringAlignment.Center;

                    // 1. Republic Header
                    using (Font f1 = new Font("Segoe UI", 15f, FontStyle.Bold))
                    using (Brush b1 = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    {
                        g.DrawString("الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية", f1, b1, new RectangleF(60, 56, 1120, 32), rtlCenter);
                    }

                    // Extract Institution, Teacher, Academic Year, Level
                    string instName = "المؤسسة التعليمية";
                    Match mInst = Regex.Match(html ?? "", @"inf\.dll\):[\s\S]*?<span>([^<]+)</span>");
                    if (mInst.Success) instName = CleanHtml(mInst.Groups[1].Value);
                    else
                    {
                        Match mInst2 = Regex.Match(html ?? "", @"المؤسسة:[\s\S]*?<strong>([^<]+)</strong>");
                        if (mInst2.Success) instName = CleanHtml(mInst2.Groups[1].Value);
                    }

                    string teachName = "الأستاذ المشرف";
                    Match mTeach = Regex.Match(html ?? "", @"المشرف البيداغوجي والمؤسسة[\s\S]*?<strong>([^<]+)</strong>");
                    if (mTeach.Success) teachName = CleanHtml(mTeach.Groups[1].Value);
                    else
                    {
                        Match mTeach2 = Regex.Match(html ?? "", @"الأستاذ المشرف:[\s\S]*?<strong>([^<]+)</strong>");
                        if (mTeach2.Success) teachName = CleanHtml(mTeach2.Groups[1].Value);
                    }

                    string acadYear = "2025/2026";
                    Match mYear = Regex.Match(html ?? "", @"Année scolaire:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mYear.Success) acadYear = CleanHtml(mYear.Groups[1].Value);

                    string levelName = "1AS (جذع مشترك)";
                    Match mLevel = Regex.Match(html ?? "", @"Niveau:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mLevel.Success) levelName = CleanHtml(mLevel.Groups[1].Value);

                    // Extract or find Logo Image (Strict: ONLY from HTML/Teacher Settings, never default fallback or disk probe)
                    Image logoImg = null;
                    try
                    {
                        Match mLogo = Regex.Match(html ?? "", @"<img[^>]*src=""data:image\/[^;]+;base64,([^""]+)""");
                        if (mLogo.Success)
                        {
                            byte[] imgBytes = Convert.FromBase64String(mLogo.Groups[1].Value);
                            using (MemoryStream ms = new MemoryStream(imgBytes))
                            {
                                logoImg = new Bitmap(Image.FromStream(ms));
                            }
                        }
                    }
                    catch { }

                    if (logoImg != null)
                    {
                        // 3-Column Header Grid (Y = 86 to 142)
                        // Right Box: Institution & Teacher (X = 700 to 1160)
                        using (Font fGridBold = new Font("Segoe UI", 11f, FontStyle.Bold))
                        using (Font fGridReg = new Font("Segoe UI", 10.5f, FontStyle.Regular))
                        using (Brush bGridText = new SolidBrush(Color.FromArgb(51, 65, 85)))
                        {
                            g.DrawString("المؤسسة: " + instName, fGridBold, bGridText, new RectangleF(700, 88, 460, 24), rtlRight);
                            g.DrawString("الأستاذ المشرف: " + teachName, fGridReg, bGridText, new RectangleF(700, 114, 460, 24), rtlRight);
                        }

                        // Center Box: Logo (X = 570 to 670, Y = 84 to 142)
                        float maxW = 90f;
                        float maxH = 54f;
                        float scale = Math.Min(maxW / logoImg.Width, maxH / logoImg.Height);
                        float destW = logoImg.Width * scale;
                        float destH = logoImg.Height * scale;
                        float destX = 620f - (destW / 2f);
                        float destY = 86f + ((maxH - destH) / 2f);
                        g.DrawImage(logoImg, destX, destY, destW, destH);

                        // Left Box: Année scolaire & Niveau (LTR, X = 80 to 540, left-aligned)
                        using (Font fGridLtr = new Font("Segoe UI", 10.5f, FontStyle.Regular))
                        using (Brush bGridText = new SolidBrush(Color.FromArgb(51, 65, 85)))
                        {
                            g.DrawString("Année scolaire: " + acadYear, fGridLtr, bGridText, new RectangleF(80, 88, 460, 24), ltrLeft);
                            g.DrawString("Niveau: " + levelName, fGridLtr, bGridText, new RectangleF(80, 114, 460, 24), ltrLeft);
                        }
                    }
                    else
                    {
                        // 2-Column Balanced Header (Zero Logo, Zero Emblem - Right & Left Symmetrical)
                        // Right Box: Institution & Teacher (X = 620 to 1160, Width = 540)
                        using (Font fGridBold = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                        using (Font fGridReg = new Font("Segoe UI", 11f, FontStyle.Regular))
                        using (Brush bGridText = new SolidBrush(Color.FromArgb(51, 65, 85)))
                        {
                            g.DrawString("المؤسسة: " + instName, fGridBold, bGridText, new RectangleF(620, 88, 540, 25), rtlRight);
                            g.DrawString("الأستاذ المشرف: " + teachName, fGridReg, bGridText, new RectangleF(620, 115, 540, 25), rtlRight);
                        }

                        // Left Box: Année scolaire & Niveau (LTR, X = 80 to 620, Width = 540, left-aligned)
                        using (Font fGridLtr = new Font("Segoe UI", 11f, FontStyle.Regular))
                        using (Brush bGridText = new SolidBrush(Color.FromArgb(51, 65, 85)))
                        {
                            g.DrawString("Année scolaire: " + acadYear, fGridLtr, bGridText, new RectangleF(80, 88, 540, 25), ltrLeft);
                            g.DrawString("Niveau: " + levelName, fGridLtr, bGridText, new RectangleF(80, 115, 540, 25), ltrLeft);
                        }
                    }

                    // Banner (Y = 148 to 214)
                    using (Brush bgBanner = new SolidBrush(Color.FromArgb(248, 250, 252)))
                    using (Pen pBanner = new Pen(Color.FromArgb(226, 232, 240), 1.5f))
                    {
                        g.FillRectangle(bgBanner, 80, 148, 1080, 64);
                        g.DrawRectangle(pBanner, 80, 148, 1080, 64);
                    }

                    using (Font fTitle = new Font("Segoe UI", 16f, FontStyle.Bold))
                    using (Brush bTitle = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    {
                        g.DrawString("بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي", fTitle, bTitle, new RectangleF(80, 154, 1080, 30), rtlCenter);
                    }

                    using (Font fSub = new Font("Segoe UI", 10.5f, FontStyle.Regular))
                    using (Brush bSub = new SolidBrush(Color.FromArgb(71, 85, 105)))
                    {
                        g.DrawString("المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)", fSub, bSub, new RectangleF(80, 184, 1080, 22), rtlCenter);
                    }

                    // Extract student info
                    string stuName = "عمورن فخر الدين";
                    Match mName = Regex.Match(html ?? "", @"اسم ولقب التلميذ:[\s\S]*?<div class=""a4-cell-val""[^>]*>([^<]+)</div>");
                    if (mName.Success) stuName = CleanHtml(mName.Groups[1].Value);
                    else
                    {
                        Match mName2 = Regex.Match(html ?? "", @"بطاقة تقويم الأعمال التطبيقية - ([^<\n]+)");
                        if (mName2.Success) stuName = CleanHtml(mName2.Groups[1].Value);
                    }

                    string className = "السنة الأولى ثانوي";
                    Match mClass = Regex.Match(html ?? "", @"الفوج التربوي ورقم الجهاز:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mClass.Success) className = CleanHtml(mClass.Groups[1].Value);

                    string pcNumber = "01";
                    Match mPc = Regex.Match(html ?? "", @"حاسوب <bdi[^>]*>#([^<]+)</bdi>");
                    if (mPc.Success) pcNumber = CleanHtml(mPc.Groups[1].Value);

                    string sessionMode = "استطلاع وتدريب";
                    Match mMode = Regex.Match(html ?? "", @"طبيعة النشاط ونمط المحاكاة:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mMode.Success) sessionMode = CleanHtml(mMode.Groups[1].Value);

                    string dateText = DateTime.Now.ToString("yyyy/MM/dd");
                    Match mDate = Regex.Match(html ?? "", @"تاريخ وتوقيت الإنجاز:[\s\S]*?<div class=""a4-cell-val""[^>]*><bdi[^>]*>([^<]+)</bdi>");
                    if (mDate.Success) dateText = CleanHtml(mDate.Groups[1].Value);

                    string durText = "00:07:48";
                    Match mDur = Regex.Match(html ?? "", @"الوقت الإجمالي المستغرق:[\s\S]*?<div class=""a4-cell-val""[^>]*><bdi[^>]*>([^<]+)</bdi>");
                    if (mDur.Success) durText = CleanHtml(mDur.Groups[1].Value);

                    // Final Score
                    string scoreVal = "11.30";
                    Match mScore = Regex.Match(html ?? "", @"class=""a4-score-earned""[^>]*>([0-9]+\.[0-9]{2})");
                    if (!mScore.Success)
                    {
                        mScore = Regex.Match(html ?? "", @"class=""a4-tsc-grade""[^>]*>[\s\S]*?<bdi[^>]*>([0-9]+\.[0-9]{2})");
                    }
                    if (!mScore.Success)
                    {
                        mScore = Regex.Match(html ?? "", @"(\d+\.\d{2})\s*/\s*20");
                    }
                    if (mScore.Success) scoreVal = CleanHtml(mScore.Groups[1].Value);

                    double scoreNum = 0;
                    double.TryParse(scoreVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out scoreNum);
                    bool isPass = scoreNum >= 10.0;

                    // Section B: Parse Table Rows from HTML FIRST to get task counts and completion status
                    string tableHtml = "";
                    Match mTable = Regex.Match(html ?? "", @"<table class=""a4-report-table""[^>]*>([\s\S]*?)<\/table>");
                    if (mTable.Success) tableHtml = mTable.Groups[1].Value;

                    List<NativeReportRow> rows = new List<NativeReportRow>();
                    MatchCollection rowMatches = Regex.Matches(tableHtml, @"<tr[^>]*>([\s\S]*?)<\/tr>");
                    foreach (Match rm in rowMatches)
                    {
                        string rHtml = rm.Groups[1].Value;
                        if (rHtml.IndexOf("<th", StringComparison.OrdinalIgnoreCase) >= 0) continue;
                        MatchCollection tdMatches = Regex.Matches(rHtml, @"<td[^>]*>([\s\S]*?)<\/td>");
                        if (tdMatches.Count >= 8)
                        {
                            NativeReportRow r = new NativeReportRow();
                            r.Num = CleanHtml(tdMatches[0].Groups[1].Value);
                            r.Title = CleanHtml(tdMatches[1].Groups[1].Value);
                            r.Type = CleanHtml(tdMatches[2].Groups[1].Value);
                            r.Status = CleanHtml(tdMatches[3].Groups[1].Value);
                            r.Attempts = CleanHtml(tdMatches[4].Groups[1].Value);
                            r.Max = CleanHtml(tdMatches[5].Groups[1].Value);
                            r.Earned = CleanHtml(tdMatches[6].Groups[1].Value);
                            r.Deduct = CleanHtml(tdMatches[7].Groups[1].Value);
                            r.Notes = tdMatches.Count > 8 ? CleanHtml(tdMatches[8].Groups[1].Value) : "";
                            r.IsQuiz = (r.Type.IndexOf("سؤال", StringComparison.OrdinalIgnoreCase) >= 0);
                            r.IsPenalty = (r.Type.IndexOf("مخالفة", StringComparison.OrdinalIgnoreCase) >= 0 || r.Num == "-");
                            rows.Add(r);
                        }
                        else if (tdMatches.Count >= 2 && rHtml.IndexOf("المجموع الكلي", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            NativeReportRow f = new NativeReportRow();
                            f.IsFooter = true;
                            f.Title = CleanHtml(tdMatches[0].Groups[1].Value);
                            f.Max = CleanHtml(tdMatches[1].Groups[1].Value);
                            if (tdMatches.Count > 2) f.Earned = CleanHtml(tdMatches[2].Groups[1].Value);
                            if (tdMatches.Count > 3) f.Deduct = CleanHtml(tdMatches[3].Groups[1].Value);
                            if (tdMatches.Count > 4) f.Notes = CleanHtml(tdMatches[4].Groups[1].Value);
                            rows.Add(f);
                        }
                    }

                    // Fallback rows if HTML table had no parsed data
                    if (rows.Count == 0)
                    {
                        string[] defTasks = new string[] {
                            "تغيير لغة عرض Windows",
                            "ضبط خصائص الفأرة ومؤشرها",
                            "إضافة لغة الإدخال وضبط المنطقة الزمنية (GMT+1)",
                            "تخصيص المظهر والخلفية وألوان التمييز",
                            "تثبيت وإلغاء تثبيت البرامج وإدارة الميزات الاختيارية",
                            "إدارة حسابات المستخدمين وكلمات المرور والصلاحيات"
                        };
                        for (int dt = 0; dt < defTasks.Length; dt++)
                        {
                            NativeReportRow dr = new NativeReportRow();
                            dr.Num = (dt + 1).ToString();
                            dr.Title = defTasks[dt];
                            dr.Type = "مهمة عملية";
                            dr.Status = (dt < 5) ? "مكتملة ✔" : "غير منجزة ✘";
                            dr.Attempts = (dt < 5) ? "1" : "-";
                            dr.Max = (dt == 5) ? "4.00" : (dt == 4 ? "4.00" : (dt == 3 ? "3.00" : (dt == 2 ? "2.00" : (dt == 1 ? "2.00" : "1.00"))));
                            dr.Earned = (dt < 5) ? dr.Max : "0.00";
                            dr.Deduct = (dt < 5) ? "0.00" : dr.Max;
                            dr.Notes = (dt < 5) ? "تم إنجاز كافة خطوات المهمة بنجاح." : "المهمة غير منجزة (قيد الإنجاز 0 من 4 خطوات).";
                            rows.Add(dr);
                        }
                    }

                    // Compute dynamic completion status
                    int practicalTotal = 0;
                    int practicalDone = 0;
                    foreach (var r in rows)
                    {
                        if (!r.IsQuiz && !r.IsPenalty && !r.IsFooter)
                        {
                            practicalTotal++;
                            if (r.Status.IndexOf("مكتملة", StringComparison.OrdinalIgnoreCase) >= 0 || r.Status.IndexOf("✔", StringComparison.OrdinalIgnoreCase) >= 0 || r.Status.IndexOf("✓", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                practicalDone++;
                            }
                        }
                    }

                    bool isAllCompleted = (practicalTotal > 0 && practicalDone == practicalTotal);
                    bool isZeroCompleted = (practicalDone == 0);
                    int completionPctNum = practicalTotal > 0 ? (int)Math.Round((double)practicalDone / practicalTotal * 100.0) : 0;

                    // Match dynamic clarifier and badge from HTML if present
                    string durClarifierText = "";
                    string durBadgeText = "";
                    Color durBgColor = Color.FromArgb(239, 246, 255);
                    Color durBorderColor = Color.FromArgb(37, 99, 235);
                    Color durTextColor = Color.FromArgb(30, 64, 175);

                    if (isAllCompleted)
                    {
                        durClarifierText = "تم تثبيت وقت الإنجاز النهائي لكافة المهام";
                        durBadgeText = "✔ جلسة مكتملة ومستوفاة لكافة المهام (" + practicalDone + " / " + practicalTotal + " مهام — 100%)";
                        durBgColor = Color.FromArgb(240, 253, 244);
                        durBorderColor = Color.FromArgb(22, 163, 74);
                        durTextColor = Color.FromArgb(21, 128, 61);
                    }
                    else if (isZeroCompleted)
                    {
                        durClarifierText = "توقيت استخراج التقرير (لم تُنجز أي مهمة عملية)";
                        durBadgeText = "✘ جلسة غير منجزة (0 / " + practicalTotal + " مهام — 0%)";
                        durBgColor = Color.FromArgb(254, 242, 242);
                        durBorderColor = Color.FromArgb(220, 38, 38);
                        durTextColor = Color.FromArgb(185, 28, 28);
                    }
                    else
                    {
                        int rem = practicalTotal - practicalDone;
                        durClarifierText = "توقيت استخراج التقرير (الجلسة غير مكتملة — بقيت " + rem + " مهام)";
                        durBadgeText = "⚠️ جلسة غير مكتملة — منجزة جزئياً (" + practicalDone + " / " + practicalTotal + " مهام — " + completionPctNum + "%)";
                        durBgColor = Color.FromArgb(255, 251, 235);
                        durBorderColor = Color.FromArgb(217, 119, 6);
                        durTextColor = Color.FromArgb(180, 83, 9);
                    }

                    string sessionProgressText = isAllCompleted ? ("مكتملة بالكامل (" + practicalDone + "/" + practicalTotal + " — 100%)") : (isZeroCompleted ? ("غير منجزة (0/" + practicalTotal + " — 0%)") : ("منجزة جزئياً (" + practicalDone + "/" + practicalTotal + " — " + completionPctNum + "%)"));

                    // Section A: Student Box (Y = 220 to 304)
                    using (Brush bgBox = new SolidBrush(Color.FromArgb(241, 245, 249)))
                    using (Pen pBox = new Pen(Color.FromArgb(203, 213, 225), 1.2f))
                    {
                        g.FillRectangle(bgBox, 80, 220, 1080, 84);
                        g.DrawRectangle(pBox, 80, 220, 1080, 84);
                    }

                    using (Font fLabel = new Font("Segoe UI", 12f, FontStyle.Bold))
                    using (Brush bDark = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    {
                        g.DrawString("اسم ولقب التلميذ(ة): " + stuName + "      |      الفوج: " + className + "      |      الجهاز: #" + pcNumber, fLabel, bDark, new RectangleF(100, 230, 1040, 28), rtlRight);
                        g.DrawString("النشاط: " + sessionMode + "      |      تاريخ الإنجاز: " + dateText + "      |      حالة الجلسة: " + sessionProgressText, fLabel, bDark, new RectangleF(100, 264, 1040, 28), rtlRight);
                    }

                    // Top Highlights: Score Card (Right) & Duration Card (Left)
                    // Score Box (Right: X = 630, W = 530, Y = 312, H = 96)
                    Color scoreBg = isPass ? Color.FromArgb(240, 253, 244) : Color.FromArgb(254, 243, 199);
                    Color scoreBorder = isPass ? Color.FromArgb(22, 163, 74) : Color.FromArgb(217, 119, 6);
                    Color scoreTextColor = isPass ? Color.FromArgb(21, 128, 61) : Color.FromArgb(180, 83, 9);

                    using (Brush bgScore = new SolidBrush(scoreBg))
                    using (Pen pScore = new Pen(scoreBorder, 2f))
                    {
                        g.FillRectangle(bgScore, 630, 312, 530, 96);
                        g.DrawRectangle(pScore, 630, 312, 530, 96);
                    }
                    using (Font fScoreLbl = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                    using (Brush bScoreLbl = new SolidBrush(scoreTextColor))
                    {
                        g.DrawString("العلامة النهائية المستحقة:", fScoreLbl, bScoreLbl, new RectangleF(640, 318, 510, 20), rtlCenter);
                    }
                    using (Font fScoreVal = new Font("Segoe UI", 24f, FontStyle.Bold))
                    using (Brush bScoreVal = new SolidBrush(scoreTextColor))
                    {
                        // STRICT LTR SO "11.30 / 20.00" IS NEVER REVERSED TO "20.00 / 11.30"!
                        g.DrawString(scoreVal + " / 20.00", fScoreVal, bScoreVal, new RectangleF(640, 340, 510, 30), ltrCenter);
                    }
                    using (Font fScoreClarifier = new Font("Segoe UI", 10f, FontStyle.Bold))
                    using (Brush bScoreClarifier = new SolidBrush(scoreTextColor))
                    {
                        g.DrawString("(" + scoreVal + " من أصل 20.00)", fScoreClarifier, bScoreClarifier, new RectangleF(640, 370, 510, 18), rtlCenter);
                    }
                    using (Font fScoreBadge = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                    using (Brush bScoreBadge = new SolidBrush(scoreTextColor))
                    {
                        string badgeMsg = isPass ? "✔ مستوفٍ لمعيار النجاح — معتمد" : "✘ دون المعدل المطلوب";
                        g.DrawString(badgeMsg, fScoreBadge, bScoreBadge, new RectangleF(640, 388, 510, 18), rtlCenter);
                    }

                    // Duration Box (Left: X = 80, W = 530, Y = 312, H = 96)
                    using (Brush bgDur = new SolidBrush(durBgColor))
                    using (Pen pDur = new Pen(durBorderColor, 2f))
                    {
                        g.FillRectangle(bgDur, 80, 312, 530, 96);
                        g.DrawRectangle(pDur, 80, 312, 530, 96);
                    }
                    using (Font fDurLbl = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                    using (Brush bDurTitle = new SolidBrush(durTextColor))
                    {
                        g.DrawString("الوقت المستغرق وحالة الجلسة:", fDurLbl, bDurTitle, new RectangleF(90, 318, 510, 20), rtlCenter);
                    }
                    using (Font fDurVal = new Font("Consolas", 24f, FontStyle.Bold))
                    using (Brush bDurVal = new SolidBrush(durTextColor))
                    {
                        g.DrawString(durText, fDurVal, bDurVal, new RectangleF(90, 340, 510, 30), ltrCenter);
                    }
                    using (Font fDurClarifier = new Font("Segoe UI", 10f, FontStyle.Bold))
                    using (Brush bDurClar = new SolidBrush(durTextColor))
                    {
                        g.DrawString(durClarifierText, fDurClarifier, bDurClar, new RectangleF(90, 370, 510, 18), rtlCenter);
                    }
                    using (Font fDurBadge = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                    using (Brush bDurBadg = new SolidBrush(durTextColor))
                    {
                        g.DrawString(durBadgeText, fDurBadge, bDurBadg, new RectangleF(90, 388, 510, 18), rtlCenter);
                    }

                    int curY = 416;

                    // Section B Title
                    using (Brush bgSec = new SolidBrush(Color.FromArgb(241, 245, 249)))
                    using (Pen pSec = new Pen(Color.FromArgb(203, 213, 225), 1f))
                    using (Brush bSecText = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    using (Font fSec = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                    {
                        g.FillRectangle(bgSec, 80, curY, 1080, 26);
                        g.DrawRectangle(pSec, 80, curY, 1080, 26);
                        using (Brush bAccentBar = new SolidBrush(Color.FromArgb(30, 58, 138)))
                        {
                            g.FillRectangle(bAccentBar, 1156, curY, 4, 26);
                        }
                        g.DrawString("القسم (ب): جدول التفصيل الدقيق للمهام العملية والأسئلة التقويمية", fSec, bSecText, new RectangleF(90, curY + 2, 1060, 22), rtlRight);
                    }
                    curY += 28;

                    // Table Layout: 9 Columns totaling 1080px (X = 80 to 1160)
                    // Col 0: # (W: 36, X: 1124)
                    // Col 1: Title (W: 300, X: 824)
                    // Col 2: Type (W: 94, X: 730)
                    // Col 3: Status (W: 100, X: 630)
                    // Col 4: Attempts (W: 76, X: 554)
                    // Col 5: Max (W: 65, X: 489)
                    // Col 6: Earned (W: 65, X: 424)
                    // Col 7: Deduct (W: 65, X: 359)
                    // Col 8: Notes (W: 279, X: 80)
                    int cX_Num = 1124, cW_Num = 36;
                    int cX_Title = 824, cW_Title = 300;
                    int cX_Type = 730, cW_Type = 94;
                    int cX_Status = 630, cW_Status = 100;
                    int cX_Att = 554, cW_Att = 76;
                    int cX_Max = 489, cW_Max = 65;
                    int cX_Earn = 424, cW_Earn = 65;
                    int cX_Ded = 359, cW_Ded = 65;
                    int cX_Notes = 80, cW_Notes = 279;

                    // Table Header
                    int thHeight = 28;
                    using (Brush bgTh = new SolidBrush(Color.FromArgb(241, 245, 249)))
                    using (Pen pGrid = new Pen(Color.FromArgb(203, 213, 225), 1f))
                    using (Brush bTh = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    using (Font fTh = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                    {
                        g.FillRectangle(bgTh, 80, curY, 1080, thHeight);
                        g.DrawRectangle(pGrid, 80, curY, 1080, thHeight);
                        g.DrawString("#", fTh, bTh, new RectangleF(cX_Num, curY, cW_Num, thHeight), rtlCenter);
                        g.DrawString("المهمة التطبيقية أو السؤال", fTh, bTh, new RectangleF(cX_Title, curY, cW_Title, thHeight), rtlRight);
                        g.DrawString("النوع", fTh, bTh, new RectangleF(cX_Type, curY, cW_Type, thHeight), rtlCenter);
                        g.DrawString("الحالة", fTh, bTh, new RectangleF(cX_Status, curY, cW_Status, thHeight), rtlCenter);
                        g.DrawString("المحاولات", fTh, bTh, new RectangleF(cX_Att, curY, cW_Att, thHeight), rtlCenter);
                        g.DrawString("الوزن", fTh, bTh, new RectangleF(cX_Max, curY, cW_Max, thHeight), ltrCenter);
                        g.DrawString("الممنوحة", fTh, bTh, new RectangleF(cX_Earn, curY, cW_Earn, thHeight), ltrCenter);
                        g.DrawString("الخصم", fTh, bTh, new RectangleF(cX_Ded, curY, cW_Ded, thHeight), ltrCenter);
                        g.DrawString("الملاحظات وتفاصيل الإنجاز", fTh, bTh, new RectangleF(cX_Notes, curY, cW_Notes, thHeight), rtlRight);
                    }
                    curY += thHeight;

                    // Draw Table Rows (Dynamic Height with zero text clipping)
                    using (Pen pGrid = new Pen(Color.FromArgb(203, 213, 225), 1f))
                    using (Font fTdBold = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                    using (Font fTdReg = new Font("Segoe UI", 9f, FontStyle.Regular))
                    using (Font fTdNotes = new Font("Segoe UI", 8.5f, FontStyle.Regular))
                    using (Brush bText = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    using (Brush bRed = new SolidBrush(Color.FromArgb(220, 38, 38)))
                    using (Brush bGreen = new SolidBrush(Color.FromArgb(21, 128, 61)))
                    using (Brush bPurple = new SolidBrush(Color.FromArgb(109, 40, 217)))
                    {
                        for (int rIdx = 0; rIdx < rows.Count; rIdx++)
                        {
                            NativeReportRow row = rows[rIdx];
                            if (row.IsFooter)
                            {
                                int ftrH = 28;
                                // Footer row
                                using (Brush bgFooter = new SolidBrush(Color.FromArgb(248, 250, 252)))
                                {
                                    g.FillRectangle(bgFooter, 80, curY, 1080, ftrH);
                                }
                                g.DrawRectangle(pGrid, 80, curY, 1080, ftrH);
                                g.DrawString(row.Title, fTdBold, bText, new RectangleF(cX_Att, curY, (cX_Num + cW_Num) - cX_Att, ftrH), rtlRight);
                                g.DrawString(row.Max, fTdBold, bText, new RectangleF(cX_Max, curY, cW_Max, ftrH), ltrCenter);
                                g.DrawString(row.Earned, fTdBold, bGreen, new RectangleF(cX_Earn, curY, cW_Earn, ftrH), ltrCenter);
                                g.DrawString(row.Deduct, fTdBold, bRed, new RectangleF(cX_Ded, curY, cW_Ded, ftrH), ltrCenter);
                                g.DrawString(row.Notes, fTdReg, bText, new RectangleF(cX_Notes, curY, cW_Notes, ftrH), rtlRight);
                                curY += ftrH;
                                continue;
                            }

                            // Dynamic measurement of row height to prevent text clipping
                            SizeF sizeT = g.MeasureString(row.Title, fTdReg, cW_Title - 8);
                            SizeF sizeN = g.MeasureString(row.Notes, fTdNotes, cW_Notes - 8);
                            int contentH = (int)Math.Ceiling(Math.Max(sizeT.Height, sizeN.Height)) + 8;
                            int rowH = Math.Max(26, contentH);

                            Color rowBg = (rIdx % 2 == 0) ? Color.White : Color.FromArgb(248, 250, 252);
                            if (row.IsQuiz) rowBg = Color.FromArgb(250, 245, 255);
                            else if (row.IsPenalty) rowBg = Color.FromArgb(255, 245, 245);

                            using (Brush bRowBg = new SolidBrush(rowBg))
                            {
                                g.FillRectangle(bRowBg, 80, curY, 1080, rowH);
                            }
                            g.DrawRectangle(pGrid, 80, curY, 1080, rowH);

                            // Col 0: #
                            Brush numBrush = row.IsQuiz ? bPurple : (row.IsPenalty ? bRed : bText);
                            g.DrawString(row.Num, fTdBold, numBrush, new RectangleF(cX_Num, curY, cW_Num, rowH), rtlCenter);

                            // Col 1: Title (Multi-line comfortable rendering with rtlNearTop)
                            g.DrawString(row.Title, fTdReg, bText, new RectangleF(cX_Title + 4, curY + 4, cW_Title - 8, rowH - 6), rtlNearTop);

                            // Col 2: Type
                            Color typeBg = row.IsQuiz ? Color.FromArgb(245, 243, 255) : (row.IsPenalty ? Color.FromArgb(254, 242, 242) : Color.FromArgb(239, 246, 255));
                            Color typeFg = row.IsQuiz ? Color.FromArgb(109, 40, 217) : (row.IsPenalty ? Color.FromArgb(185, 28, 28) : Color.FromArgb(29, 78, 216));
                            int badgeH = 20;
                            int badgeY = curY + ((rowH - badgeH) / 2);
                            using (Brush bTypeBg = new SolidBrush(typeBg))
                            using (Brush bTypeFg = new SolidBrush(typeFg))
                            {
                                g.FillRectangle(bTypeBg, cX_Type + 4, badgeY, cW_Type - 8, badgeH);
                                g.DrawString(row.Type, fTdBold, bTypeFg, new RectangleF(cX_Type, curY, cW_Type, rowH), rtlCenter);
                            }

                            // Col 3: Status Badge
                            bool isStDone = row.Status.IndexOf("✔") >= 0 || row.Status.IndexOf("مكتملة") >= 0 || row.Status.IndexOf("صحيحة") >= 0;
                            bool isStFail = row.Status.IndexOf("✘") >= 0 || row.Status.IndexOf("غير") >= 0 || row.Status.IndexOf("معطّل") >= 0 || row.Status.IndexOf("خصم") >= 0;
                            Color stBg = isStDone ? Color.FromArgb(220, 252, 231) : (isStFail ? Color.FromArgb(254, 226, 226) : Color.FromArgb(254, 243, 199));
                            Color stFg = isStDone ? Color.FromArgb(21, 128, 61) : (isStFail ? Color.FromArgb(185, 28, 28) : Color.FromArgb(180, 83, 9));
                            using (Brush bStBg = new SolidBrush(stBg))
                            using (Brush bStFg = new SolidBrush(stFg))
                            {
                                g.FillRectangle(bStBg, cX_Status + 4, badgeY, cW_Status - 8, badgeH);
                                g.DrawString(row.Status, fTdBold, bStFg, new RectangleF(cX_Status, curY, cW_Status, rowH), rtlCenter);
                            }

                            // Col 4: Attempts
                            g.DrawString(row.Attempts, fTdReg, bText, new RectangleF(cX_Att, curY, cW_Att, rowH), rtlCenter);

                            // Col 5: Max Points
                            g.DrawString(row.Max, fTdReg, bText, new RectangleF(cX_Max, curY, cW_Max, rowH), ltrCenter);

                            // Col 6: Earned Points
                            g.DrawString(row.Earned, fTdBold, row.IsQuiz ? bPurple : bGreen, new RectangleF(cX_Earn, curY, cW_Earn, rowH), ltrCenter);

                            // Col 7: Deduction
                            bool hasDed = row.Deduct.IndexOf("-") >= 0 || (row.Deduct != "0.00" && row.Deduct != "0" && !string.IsNullOrEmpty(row.Deduct));
                            g.DrawString(row.Deduct, fTdBold, hasDed ? bRed : bText, new RectangleF(cX_Ded, curY, cW_Ded, rowH), ltrCenter);

                            // Col 8: Notes (Multi-line comfortable rendering with rtlNearTop)
                            g.DrawString(row.Notes, fTdNotes, bText, new RectangleF(cX_Notes + 4, curY + 4, cW_Notes - 8, rowH - 6), rtlNearTop);

                            curY += rowH;
                        }
                    }

                    curY += 12;

                    // Section C: Step-by-Step Math Breakdown
                    using (Brush bgSecC = new SolidBrush(Color.FromArgb(241, 245, 249)))
                    using (Pen pSecC = new Pen(Color.FromArgb(203, 213, 225), 1f))
                    using (Brush bSecCText = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    using (Font fSecC = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                    {
                        g.FillRectangle(bgSecC, 80, curY, 1080, 26);
                        g.DrawRectangle(pSecC, 80, curY, 1080, 26);
                        using (Brush bAccentBar = new SolidBrush(Color.FromArgb(30, 58, 138)))
                        {
                            g.FillRectangle(bAccentBar, 1156, curY, 4, 26);
                        }
                        g.DrawString("القسم (ج): التفكيك الحسابي للعلامة (احتساب المعدل وفق القاعدة الثلاثية الرسمية)", fSecC, bSecCText, new RectangleF(90, curY + 2, 1060, 22), rtlRight);
                    }
                    curY += 30;

                    // Parse Math Steps from HTML
                    List<NativeMathStep> mathSteps = new List<NativeMathStep>();
                    MatchCollection mathMatches = Regex.Matches(html ?? "", @"<div class=""a4-math-step[^""]*"">([\s\S]*?)<\/div>");
                    foreach (Match mm in mathMatches)
                    {
                        string mHtml = mm.Groups[1].Value;
                        NativeMathStep ms = new NativeMathStep();
                        Match mNum = Regex.Match(mHtml, @"class=""a4-step-num""[^>]*>([^<]+)");
                        if (mNum.Success) ms.Num = CleanHtml(mNum.Groups[1].Value);
                        Match mLbl = Regex.Match(mHtml, @"class=""a4-step-lbl""[^>]*>([\s\S]*?)<\/span>");
                        if (mLbl.Success) ms.Label = CleanHtml(mLbl.Groups[1].Value);
                        Match mVal = Regex.Match(mHtml, @"class=""a4-step-val""[^>]*>([\s\S]*?)<\/span>");
                        if (mVal.Success) ms.Value = CleanHtml(mVal.Groups[1].Value);
                        Match mSub = Regex.Match(mHtml, @"class=""a4-step-sub""[^>]*>([\s\S]*?)<\/span>");
                        if (mSub.Success) ms.Sub = CleanHtml(mSub.Groups[1].Value);
                        mathSteps.Add(ms);
                    }

                    if (mathSteps.Count == 0)
                    {
                        mathSteps.Add(new NativeMathStep { Num = "1", Label = "مجموع معاملات المهام العملية النشطة:", Value = "17.00 نقطة", Sub = "تم استيفاء المهام العملية المطلوبة" });
                        mathSteps.Add(new NativeMathStep { Num = "2", Label = "مجموع معاملات الأسئلة التقويمية:", Value = "6.00 نقاط", Sub = "الأسئلة التقويمية المرافقة للمهام" });
                        mathSteps.Add(new NativeMathStep { Num = "3", Label = "المجموع الكلي لأوزان التقييم (المقام):", Value = "23.00 نقطة", Sub = "المعاملات الإجمالية المطلوبة" });
                        mathSteps.Add(new NativeMathStep { Num = "4", Label = "مجموع النقاط المكتسبة (البسط):", Value = "13.00 نقطة", Sub = "مجموع نقاط المهام والأسئلة الممنوحة" });
                        mathSteps.Add(new NativeMathStep { Num = "5", Label = "تطبيق القاعدة الثلاثية الرسمية:", Value = "11.30 / 20", Sub = "(13.00 ÷ 23.00) × 20 = 11.30" });
                        mathSteps.Add(new NativeMathStep { Num = "6", Label = "العلامة النهائية المستحقة:", Value = scoreVal + " / 20", Sub = "العلامة الرسمية بعد معالجة الخصومات" });
                    }

                    // Draw Math Steps Grid
                    int mathStepHeight = 28;
                    using (Font fStepNum = new Font("Segoe UI", 9f, FontStyle.Bold))
                    using (Font fStepLbl = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                    using (Font fStepVal = new Font("Segoe UI", 10.5f, FontStyle.Bold))
                    using (Font fStepSub = new Font("Segoe UI", 8.5f, FontStyle.Regular))
                    using (Brush bStepCircle = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    using (Brush bWhite = new SolidBrush(Color.White))
                    using (Brush bStepText = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    using (Brush bStepSubText = new SolidBrush(Color.FromArgb(100, 116, 139)))
                    using (Pen pStepBorder = new Pen(Color.FromArgb(226, 232, 240), 1f))
                    {
                        for (int sIdx = 0; sIdx < mathSteps.Count; sIdx++)
                        {
                            NativeMathStep step = mathSteps[sIdx];
                            bool isFormula = (sIdx == 4);
                            bool isFinal = (sIdx == 5);

                            Color stepBg = isFinal ? Color.FromArgb(240, 253, 244) : (isFormula ? Color.FromArgb(240, 249, 255) : Color.FromArgb(248, 250, 252));
                            Color stepBorderCol = isFinal ? Color.FromArgb(187, 247, 208) : (isFormula ? Color.FromArgb(186, 230, 253) : Color.FromArgb(226, 232, 240));

                            using (Brush bStepBg = new SolidBrush(stepBg))
                            using (Pen pStepBox = new Pen(stepBorderCol, 1.2f))
                            {
                                g.FillRectangle(bStepBg, 80, curY, 1080, mathStepHeight);
                                g.DrawRectangle(pStepBox, 80, curY, 1080, mathStepHeight);
                            }

                            // Step Number Circle
                            g.FillEllipse(bStepCircle, 1134, curY + 4, 20, 20);
                            g.DrawString(step.Num, fStepNum, bWhite, new RectangleF(1134, curY + 4, 20, 20), ltrCenter);

                            // Step Label
                            g.DrawString(step.Label, fStepLbl, bStepText, new RectangleF(650, curY, 474, mathStepHeight), rtlRight);

                            // Step Value (STRICT LTR if contains '/' so numerator/denominator is never inverted to e.g. 20/14.78)
                            Brush valBrush = isFinal ? new SolidBrush(Color.FromArgb(21, 128, 61)) : bStepText;
                            bool valHasSlash = (step.Value ?? "").IndexOf("/") >= 0;
                            g.DrawString(step.Value, fStepVal, valBrush, new RectangleF(450, curY, 190, mathStepHeight), valHasSlash ? ltrCenter : rtlCenter);

                            // Step Subtext (Formula)
                            g.DrawString(step.Sub, fStepSub, bStepSubText, new RectangleF(90, curY, 350, mathStepHeight), rtlRight);

                            curY += mathStepHeight + 4;
                        }
                    }

                    // Section D: Audit & Identity Modification Log (Anti-Cheating)
                    bool hasAuditSection = (html ?? "").IndexOf("a4-section-d", StringComparison.OrdinalIgnoreCase) >= 0;
                    if (hasAuditSection)
                    {
                        curY += 12;
                        using (Brush bgSecD = new SolidBrush(Color.FromArgb(255, 251, 235)))
                        using (Pen pSecD = new Pen(Color.FromArgb(217, 119, 6), 1.2f))
                        using (Brush bSecDText = new SolidBrush(Color.FromArgb(146, 64, 14)))
                        using (Font fSecD = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                        {
                            g.FillRectangle(bgSecD, 80, curY, 1080, 26);
                            g.DrawRectangle(pSecD, 80, curY, 1080, 26);
                            using (Brush bAmberBar = new SolidBrush(Color.FromArgb(217, 119, 6)))
                            {
                                g.FillRectangle(bAmberBar, 1156, curY, 4, 26);
                            }
                            g.DrawString("القسم (د): سجل تدقيق وتعديل بيانات الهوية والجلسة (نظام مكافحة الانتحال والتحقق الأمني)", fSecD, bSecDText, new RectangleF(90, curY + 2, 1060, 22), rtlRight);
                        }
                        curY += 30;

                        // Parse audit rows from HTML
                        Match mTableD = Regex.Match(html ?? "", @"<table class=""a4-audit-table"">([\s\S]*?)<\/table>");
                        if (mTableD.Success)
                        {
                            MatchCollection dRows = Regex.Matches(mTableD.Groups[1].Value, @"<tr[^>]*>([\s\S]*?)<\/tr>");
                            bool isHeader = true;
                            foreach (Match dr in dRows)
                            {
                                string rowHtml = dr.Groups[1].Value;
                                if (isHeader)
                                {
                                    using (Brush bgH = new SolidBrush(Color.FromArgb(248, 250, 252)))
                                    using (Pen pH = new Pen(Color.FromArgb(203, 213, 225), 1f))
                                    using (Font fH = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                                    using (Brush bH = new SolidBrush(Color.FromArgb(51, 65, 85)))
                                    {
                                        g.FillRectangle(bgH, 80, curY, 1080, 24);
                                        g.DrawRectangle(pH, 80, curY, 1080, 24);
                                        g.DrawString("المرحلة", fH, bH, new RectangleF(1050, curY + 2, 100, 20), rtlCenter);
                                        g.DrawString("توقيت النظام", fH, bH, new RectangleF(930, curY + 2, 110, 20), rtlCenter);
                                        g.DrawString("وقت المحاكاة", fH, bH, new RectangleF(810, curY + 2, 110, 20), rtlCenter);
                                        g.DrawString("نسبة الإنجاز", fH, bH, new RectangleF(680, curY + 2, 120, 20), rtlCenter);
                                        g.DrawString("البيان المعدل", fH, bH, new RectangleF(530, curY + 2, 140, 20), rtlCenter);
                                        g.DrawString("تفاصيل التغيير (سابق ➔ جديد)", fH, bH, new RectangleF(90, curY + 2, 430, 20), rtlRight);
                                    }
                                    curY += 26;
                                    isHeader = false;
                                    continue;
                                }

                                MatchCollection tds = Regex.Matches(rowHtml, @"<td[^>]*>([\s\S]*?)<\/td>");
                                if (tds.Count >= 6)
                                {
                                    string cStage = CleanHtml(tds[0].Groups[1].Value);
                                    string cClock = CleanHtml(tds[1].Groups[1].Value);
                                    string cElapsed = CleanHtml(tds[2].Groups[1].Value);
                                    string cProg = CleanHtml(tds[3].Groups[1].Value);
                                    string cField = CleanHtml(tds[4].Groups[1].Value);
                                    string cDetail = CleanHtml(tds[5].Groups[1].Value);

                                    bool isInit = cStage.IndexOf("أولي", StringComparison.OrdinalIgnoreCase) >= 0;
                                    Color rowBg = isInit ? Color.FromArgb(248, 250, 252) : Color.White;

                                    using (Font fR = new Font("Segoe UI", 9f, FontStyle.Regular))
                                    using (Font fRBold = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                                    {
                                        // Dynamic measurement to prevent diff details from being cut off vertically
                                        SizeF sizeDet = g.MeasureString(cDetail, fR, 420);
                                        int auditRowH = Math.Max(28, (int)Math.Ceiling(sizeDet.Height) + 12);

                                        using (Brush bgR = new SolidBrush(rowBg))
                                        using (Pen pR = new Pen(Color.FromArgb(226, 232, 240), 1f))
                                        using (Brush bDarkR = new SolidBrush(Color.FromArgb(15, 23, 42)))
                                        using (Brush bAmber = new SolidBrush(Color.FromArgb(180, 83, 9)))
                                        using (Brush bBlue = new SolidBrush(Color.FromArgb(37, 99, 235)))
                                        {
                                            g.FillRectangle(bgR, 80, curY, 1080, auditRowH);
                                            g.DrawRectangle(pR, 80, curY, 1080, auditRowH);

                                            g.DrawString(cStage, fRBold, isInit ? bDarkR : bAmber, new RectangleF(1050, curY, 100, auditRowH), rtlCenter);
                                            g.DrawString(cClock, fRBold, bAmber, new RectangleF(930, curY, 110, auditRowH), ltrCenter);
                                            g.DrawString(cElapsed, fRBold, bAmber, new RectangleF(810, curY, 110, auditRowH), ltrCenter);
                                            g.DrawString(cProg, fR, bBlue, new RectangleF(680, curY, 120, auditRowH), rtlCenter);
                                            g.DrawString(cField, fRBold, bDarkR, new RectangleF(530, curY, 140, auditRowH), rtlCenter);
                                            g.DrawString(cDetail, fR, bDarkR, new RectangleF(90, curY + 5, 430, auditRowH - 8), rtlNearTop);
                                        }
                                        curY += auditRowH;
                                    }
                                }
                            }
                        }
                    }

                    // Signature & Seal (Anchored dynamically or at least Y = 1530, max constrained to avoid border collision)
                    int ySig = Math.Max(curY + 18, 1530);
                    if (ySig + 152 > 1705) { ySig = curY + 14; }
                    if (ySig + 152 > 1705) { ySig = 1705 - 152; }

                    using (Pen pSig = new Pen(Color.FromArgb(100, 116, 139), 1.5f))
                    {
                        pSig.DashStyle = DashStyle.Dash;
                        g.DrawRectangle(pSig, 100, ySig, 340, 120);
                    }
                    using (Font fSig = new Font("Segoe UI", 12f, FontStyle.Bold))
                    using (Brush bSig = new SolidBrush(Color.FromArgb(71, 85, 105)))
                    {
                        g.DrawString("توقيع وختم الأستاذ(ة)", fSig, bSig, new RectangleF(100, ySig + 12, 340, 28), rtlCenter);
                    }

                    using (Font fObsLbl = new Font("Segoe UI", 11f, FontStyle.Bold))
                    using (Font fObsDots = new Font("Segoe UI", 10f, FontStyle.Regular))
                    using (Brush bObs = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    using (Brush bDots = new SolidBrush(Color.FromArgb(148, 163, 184)))
                    {
                        g.DrawString("ملاحظات وتوجيهات الأستاذ(ة):", fObsLbl, bObs, new RectangleF(500, ySig + 10, 640, 24), rtlRight);
                        g.DrawString("............................................................................................................................................", fObsDots, bDots, new RectangleF(500, ySig + 42, 640, 20), rtlRight);
                        g.DrawString("............................................................................................................................................", fObsDots, bDots, new RectangleF(500, ySig + 72, 640, 20), rtlRight);
                    }

                    using (Font fDate = new Font("Segoe UI", 10.5f, FontStyle.Regular))
                    using (Brush bDate = new SolidBrush(Color.FromArgb(100, 116, 139)))
                    {
                        g.DrawString("حرر في: " + dateText, fDate, bDate, new RectangleF(750, ySig + 105, 390, 24), rtlRight);
                        g.DrawString("وثيقة تقييم رسمية غير قابلة للتعديل معتمدة لتقويم الأعمال التطبيقية", fDate, bDate, new RectangleF(750, ySig + 126, 390, 22), rtlRight);
                    }

                    using (MemoryStream ms = new MemoryStream())
                    {
                        bmp.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                        byte[] jpegBytes = ms.ToArray();
                        byte[] pdfBytes = BuildPdfFromJpeg(jpegBytes, 1240, 1754);
                        File.WriteAllBytes(targetPath, pdfBytes);
                        return true;
                    }
                }
            }
            catch
            {
                return false;
            }
        }

        private static byte[] _htmlGzBytes;
        private static byte[] _htmlBytes;
        private static string _exeDir;
        private static string _infPath;
        private static TcpListener _tcpListener;
        private static volatile bool _running = true;
        private static Process _browserProcess = null;
        private static string _tempProfileDir = null;
        private static DateTime _lastPingUtc = DateTime.UtcNow;
        private static volatile bool _hasReceivedPing = false;

        public static string ResolveInfDllPath()
        {
            List<string> candidateDirs = new List<string>();

            // 1. Process MainModule (physical directory of the running .exe)
            try
            {
                string exePath = Process.GetCurrentProcess().MainModule.FileName;
                if (!string.IsNullOrEmpty(exePath))
                {
                    string d = Path.GetDirectoryName(exePath);
                    if (!string.IsNullOrEmpty(d) && !candidateDirs.Contains(d)) candidateDirs.Add(d);
                }
            }
            catch { }

            // 2. Assembly Location directory
            try
            {
                string asmLoc = Assembly.GetExecutingAssembly().Location;
                if (!string.IsNullOrEmpty(asmLoc))
                {
                    string d = Path.GetDirectoryName(asmLoc);
                    if (!string.IsNullOrEmpty(d) && !candidateDirs.Contains(d)) candidateDirs.Add(d);
                }
            }
            catch { }

            // 3. AppDomain BaseDirectory
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                if (!string.IsNullOrEmpty(baseDir))
                {
                    baseDir = baseDir.TrimEnd('\\', '/');
                    if (!candidateDirs.Contains(baseDir)) candidateDirs.Add(baseDir);
                }
            }
            catch { }

            // 4. Environment CurrentDirectory
            try
            {
                string curDir = Environment.CurrentDirectory;
                if (!string.IsNullOrEmpty(curDir))
                {
                    curDir = curDir.TrimEnd('\\', '/');
                    if (!candidateDirs.Contains(curDir)) candidateDirs.Add(curDir);
                }
            }
            catch { }

            // 5. Parent directories of all candidate directories
            int initialCount = candidateDirs.Count;
            for (int i = 0; i < initialCount; i++)
            {
                try
                {
                    DirectoryInfo parent = Directory.GetParent(candidateDirs[i]);
                    if (parent != null && parent.Exists && !candidateDirs.Contains(parent.FullName))
                    {
                        candidateDirs.Add(parent.FullName);
                    }
                }
                catch { }
            }

            // Search for inf.dll in each directory
            for (int i = 0; i < candidateDirs.Count; i++)
            {
                try
                {
                    string dir = candidateDirs[i];
                    if (!Directory.Exists(dir)) continue;

                    string direct = Path.Combine(dir, "inf.dll");
                    if (File.Exists(direct))
                    {
                        return Path.GetFullPath(direct);
                    }

                    // Directory scan fallback in case of Samba/Linux share case variations
                    string[] files = Directory.GetFiles(dir, "*inf*.dll");
                    for (int f = 0; f < files.Length; f++)
                    {
                        string fname = Path.GetFileName(files[f]);
                        if (string.Equals(fname, "inf.dll", StringComparison.OrdinalIgnoreCase))
                        {
                            return Path.GetFullPath(files[f]);
                        }
                    }
                }
                catch { }
            }

            // If not found, default to primary executable directory
            string fallbackDir = candidateDirs.Count > 0 ? candidateDirs[0] : AppDomain.CurrentDomain.BaseDirectory;
            return Path.Combine(fallbackDir, "inf.dll");
        }

        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int SW_RESTORE = 9;

        private static void TryActivateExistingInstance()
        {
            try
            {
                IntPtr targetHwnd = IntPtr.Zero;

                EnumWindows(delegate (IntPtr hWnd, IntPtr lParam)
                {
                    if (!IsWindowVisible(hWnd)) return true;
                    StringBuilder sb = new StringBuilder(512);
                    GetWindowText(hWnd, sb, 512);
                    string title = sb.ToString();
                    if (!string.IsNullOrEmpty(title))
                    {
                        if (title.IndexOf("محاكي", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("Windows 11", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("المساعد البيداغوجي", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("127.0.0.1", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("Win11", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            targetHwnd = hWnd;
                            return false; // Stop enumeration
                        }
                    }
                    return true;
                }, IntPtr.Zero);

                if (targetHwnd != IntPtr.Zero)
                {
                    ShowWindow(targetHwnd, SW_RESTORE);
                    BringWindowToTop(targetHwnd);
                    SetForegroundWindow(targetHwnd);
                    SwitchToThisWindow(targetHwnd, true);
                    return;
                }

                // Fallback to process MainWindowHandle
                Process current = Process.GetCurrentProcess();
                Process[] procs = Process.GetProcessesByName(current.ProcessName);
                for (int i = 0; i < procs.Length; i++)
                {
                    if (procs[i].Id != current.Id && procs[i].MainWindowHandle != IntPtr.Zero)
                    {
                        ShowWindow(procs[i].MainWindowHandle, SW_RESTORE);
                        BringWindowToTop(procs[i].MainWindowHandle);
                        SetForegroundWindow(procs[i].MainWindowHandle);
                        SwitchToThisWindow(procs[i].MainWindowHandle, true);
                        return;
                    }
                }
            }
            catch { }
        }

        [STAThread]
        static int Main(string[] args)
        {
            _exeDir = AppDomain.CurrentDomain.BaseDirectory;
            _infPath = ResolveInfDllPath();

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
                    singleInstanceMutex = new Mutex(true, "Global\\Win11SimHost_SingleInstance_1AS", out createdNew);
                    if (!createdNew)
                    {
                        TryActivateExistingInstance();
                        return 0;
                    }
                }
                catch { }
            }

            if (!noBrowser && !embeddedBrowser)
            {
                SplashScreen.Show();
                SplashScreen.Update(15, "تهيئة بيئة المحاكاة والتحقق من الموارد التعليمية...");
            }

            try
            {
                if (!noBrowser && !embeddedBrowser)
                {
                    SplashScreen.Update(35, "تحميل الموارد التعليمية المضمنة...");
                }
                LoadEmbeddedHtml();
            }
            catch (Exception ex)
            {
                SplashScreen.Close();
                MessageBox.Show("Failed to load embedded simulator resources:\n" + ex.Message,
                    "Windows 11 Simulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }

            // Bind pure user-space TCP socket on 127.0.0.1 (No HttpListener / No http.sys / No Admin rights needed)
            int port = requestedPort;
            try
            {
                if (!noBrowser && !embeddedBrowser)
                {
                    SplashScreen.Update(65, "تشغيل خادم العرض المحلي (User-Space WinSock)...");
                }
                _tcpListener = new TcpListener(IPAddress.Loopback, port);
                _tcpListener.Start();
                port = ((IPEndPoint)_tcpListener.LocalEndpoint).Port;
            }
            catch (Exception ex)
            {
                SplashScreen.Close();
                MessageBox.Show("Unable to open local user-space port on 127.0.0.1:\n" + ex.Message,
                    "Windows 11 Simulator", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 2;
            }

            string baseUrl = string.Format("http://127.0.0.1:{0}/", port);
            string launchUrl = teacherMode ? (baseUrl + "?teacher=1") : baseUrl;

            Thread serverThread = new Thread(ListenLoop);
            serverThread.IsBackground = true;
            serverThread.Start();

            if (!noBrowser && !embeddedBrowser)
            {
                SplashScreen.Update(85, "جاري فتح نافذة Windows 11...");
            }

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

        private static void LoadEmbeddedHtml()
        {
            if (_htmlGzBytes != null && _htmlGzBytes.Length > 0) return;
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream raw = asm.GetManifestResourceStream("Win11_Simulator_1AS.html.gz"))
            {
                if (raw == null) throw new InvalidOperationException("Missing embedded HTML resource.");
                using (MemoryStream msGz = new MemoryStream())
                {
                    byte[] buf = new byte[65536];
                    int read;
                    while ((read = raw.Read(buf, 0, buf.Length)) > 0)
                    {
                        msGz.Write(buf, 0, read);
                    }
                    _htmlGzBytes = msGz.ToArray();
                }
            }
        }

        private static byte[] GetDecompressedHtmlBytes()
        {
            if (_htmlBytes != null) return _htmlBytes;
            if (_htmlGzBytes == null) LoadEmbeddedHtml();
            using (MemoryStream msIn = new MemoryStream(_htmlGzBytes))
            using (GZipStream gz = new GZipStream(msIn, CompressionMode.Decompress))
            using (MemoryStream msOut = new MemoryStream())
            {
                byte[] buf = new byte[65536];
                int read;
                while ((read = gz.Read(buf, 0, buf.Length)) > 0)
                {
                    msOut.Write(buf, 0, read);
                }
                _htmlBytes = msOut.ToArray();
                return _htmlBytes;
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
                client.ReceiveTimeout = 45000;
                client.SendTimeout = 45000;
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
                bool clientAcceptsGzip = false;
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
                    else if (l.StartsWith("Accept-Encoding:", StringComparison.OrdinalIgnoreCase))
                    {
                        if (l.IndexOf("gzip", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            clientAcceptsGzip = true;
                        }
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
                        string targetInf = ResolveInfDllPath();
                        if (!File.Exists(targetInf))
                        {
                            SendResponse(stream, 204, "No Content", "application/octet-stream", new byte[0], true);
                        }
                        else
                        {
                            byte[] infBytes = File.ReadAllBytes(targetInf);
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

                        string targetInf = ResolveInfDllPath();
                        try
                        {
                            if (File.Exists(targetInf))
                            {
                                File.Delete(targetInf);
                            }
                        }
                        catch { }

                        File.WriteAllBytes(targetInf, body);
                        _infPath = targetInf;

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
                            filename = "1AS_Report.pdf";
                        }

                        string safeName = SanitizeFileName(filename);
                        if (string.IsNullOrEmpty(safeName)) safeName = "1AS_Report.pdf";
                        string ext = Path.GetExtension(safeName);
                        if (string.IsNullOrEmpty(ext))
                        {
                            ext = ".pdf";
                            safeName = safeName + ".pdf";
                        }
                        string rawBase = Path.GetFileNameWithoutExtension(safeName);
                        string rootName = Regex.Replace(rawBase, @"[\s_]*(?:\(\d+\)|_\d+)$", "");

                        string targetPath = Path.Combine(desktopDir, rootName + ext);
                        if (File.Exists(targetPath))
                        {
                            int counter = 1;
                            while (File.Exists(Path.Combine(desktopDir, string.Format("{0} ({1}){2}", rootName, counter, ext))) ||
                                   File.Exists(Path.Combine(desktopDir, string.Format("{0}_{1}{2}", rootName, counter, ext))))
                            {
                                counter++;
                            }
                            targetPath = Path.Combine(desktopDir, string.Format("{0} ({1}){2}", rootName, counter, ext));
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
                            if (fileBytes != null && fileBytes.Length >= 4 &&
                                fileBytes[0] == 0x25 && fileBytes[1] == 0x50 && fileBytes[2] == 0x44 && fileBytes[3] == 0x46)
                            {
                                File.WriteAllBytes(targetPath, fileBytes);
                                pdfDone = true;
                            }
                            else
                            {
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
                                        string[] headlessVariants = new string[] { "--headless", "--headless=new" };
                                        for (int v = 0; v < headlessVariants.Length && !pdfDone; v++)
                                        {
                                            string tmpProf = Path.Combine(Path.GetTempPath(), "print_prof_" + Guid.NewGuid().ToString("N"));
                                            try
                                            {
                                                ProcessStartInfo pPsi = new ProcessStartInfo();
                                                pPsi.FileName = chromium;
                                                pPsi.Arguments = string.Format(
                                                    "{0} --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=5000 --user-data-dir=\"{1}\" --run-all-compositor-stages-before-draw --print-to-pdf=\"{2}\" \"{3}\"",
                                                    headlessVariants[v], tmpProf, targetPath, fileUrl);
                                                pPsi.UseShellExecute = false;
                                                pPsi.CreateNoWindow = true;
                                                using (Process p = Process.Start(pPsi))
                                                {
                                                    if (p != null)
                                                    {
                                                        if (!p.WaitForExit(15000))
                                                        {
                                                            try { p.Kill(); } catch { }
                                                        }
                                                        if (File.Exists(targetPath) && new FileInfo(targetPath).Length > 100)
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
                                                try { if (Directory.Exists(tmpProf)) Directory.Delete(tmpProf, true); } catch { }
                                            }
                                        }
                                    }
                                    catch { }
                                    finally
                                    {
                                        try { File.Delete(tmpHtml); } catch { }
                                    }
                                }
                            }

                            if (!pdfDone)
                            {
                                // STRICT GUARANTEE: NEVER SAVE HTML! ALWAYS SAVE VALID PDF!
                                Program.GenerateNativeReportPdf(targetPath, htmlStr);
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
                        bool isPdf = targetPath.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

                        string resJson = string.Format(
                            "{{\"ok\":true,\"filename\":\"{0}\",\"path\":\"{1}\",\"desktopDir\":\"{2}\",\"format\":\"{3}\"}}",
                            escapedName, escapedPath, escapedDir, "pdf");

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
                        else if (!string.IsNullOrEmpty(targetPath))
                        {
                            string altPath = targetPath.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
                                ? Path.ChangeExtension(targetPath, ".html")
                                : Path.ChangeExtension(targetPath, ".pdf");
                            if (File.Exists(altPath))
                            {
                                ProcessStartInfo psi = new ProcessStartInfo();
                                psi.FileName = altPath;
                                psi.UseShellExecute = true;
                                Process.Start(psi);
                            }
                            else
                            {
                                string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                                if (Directory.Exists(desktopDir))
                                {
                                    Process.Start("explorer.exe", "\"" + desktopDir + "\"");
                                }
                            }
                        }
                        else
                        {
                            string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                            if (Directory.Exists(desktopDir))
                            {
                                Process.Start("explorer.exe", "\"" + desktopDir + "\"");
                            }
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
                if (path == "/" || path == "/index.html" || path == "/api/inf")
                {
                    SplashScreen.Close();
                }

                // Adjacent Logo support (fallback if logo placed in same directory as EXE)
                if (path == "/logo.png" || path == "/logo.jpg" || path == "/logo.jpeg" || path == "/api/logo")
                {
                    string[] logoCandidates = new string[] {
                        Path.Combine(_exeDir, "logo.png"),
                        Path.Combine(_exeDir, "logo.jpg"),
                        Path.Combine(_exeDir, "logo.jpeg")
                    };
                    string foundLogo = null;
                    for (int l = 0; l < logoCandidates.Length; l++)
                    {
                        if (File.Exists(logoCandidates[l]))
                        {
                            foundLogo = logoCandidates[l];
                            break;
                        }
                    }
                    if (foundLogo != null)
                    {
                        string mime = foundLogo.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg";
                        byte[] logoBytes = File.ReadAllBytes(foundLogo);
                        SendResponse(stream, 200, "OK", mime, logoBytes, true);
                        client.Close();
                        return;
                    }
                }

                if (path == "/" || path == "/index.html")
                {
                    if (clientAcceptsGzip && _htmlGzBytes != null && _htmlGzBytes.Length > 0)
                    {
                        SendResponse(stream, 200, "OK", "text/html; charset=utf-8", _htmlGzBytes, true, "gzip");
                    }
                    else
                    {
                        byte[] rawHtml = GetDecompressedHtmlBytes();
                        SendResponse(stream, 200, "OK", "text/html; charset=utf-8", rawHtml, true, null);
                    }
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
            SendResponse(stream, statusCode, statusReason, contentType, data, cors, null);
        }

        private static void SendResponse(NetworkStream stream, int statusCode, string statusReason, string contentType, byte[] data, bool cors, string contentEncoding)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("HTTP/1.1 {0} {1}\r\n", statusCode, statusReason);
            sb.AppendFormat("Content-Type: {0}\r\n", contentType);
            if (!string.IsNullOrEmpty(contentEncoding))
            {
                sb.AppendFormat("Content-Encoding: {0}\r\n", contentEncoding);
            }
            sb.AppendFormat("Content-Length: {0}\r\n", data != null ? data.Length : 0);
            sb.Append("Cache-Control: no-store, no-cache, must-revalidate\r\n");
            sb.Append("X-UA-Compatible: IE=edge\r\n");
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

        internal static string FindChromiumBrowser()
        {
            try
            {
                string[] regKeys = new string[] { "msedge.exe", "chrome.exe", "brave.exe", "opera.exe" };
                for (int r = 0; r < regKeys.Length; r++)
                {
                    object val = Microsoft.Win32.Registry.GetValue(
                        @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + regKeys[r],
                        "", null);
                    if (val != null)
                    {
                        string p = val.ToString().Trim('"', ' ');
                        if (File.Exists(p)) return p;
                    }
                    val = Microsoft.Win32.Registry.GetValue(
                        @"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\" + regKeys[r],
                        "", null);
                    if (val != null)
                    {
                        string p = val.ToString().Trim('"', ' ');
                        if (File.Exists(p)) return p;
                    }
                }
            }
            catch { }

            string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
            string pf64 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles) ?? "";
            string pfW64 = Environment.GetEnvironmentVariable("ProgramW6432") ?? "";
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) ?? "";

            string[] candidates = new string[]
            {
                // Microsoft Edge
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(pfW64) ? "" : Path.Combine(pfW64, @"Microsoft\Edge\Application\msedge.exe"),
                string.IsNullOrEmpty(localApp) ? "" : Path.Combine(localApp, @"Microsoft\Edge\Application\msedge.exe"),
                // Google Chrome
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(pfW64) ? "" : Path.Combine(pfW64, @"Google\Chrome\Application\chrome.exe"),
                string.IsNullOrEmpty(localApp) ? "" : Path.Combine(localApp, @"Google\Chrome\Application\chrome.exe"),
                // Portable Browsers in simulator folder
                Path.Combine(_exeDir, @"chrome-win\chrome.exe"),
                Path.Combine(_exeDir, @"browser\chrome.exe"),
                Path.Combine(_exeDir, @"App\Chrome\chrome.exe"),
                // Brave
                string.IsNullOrEmpty(pf64) ? "" : Path.Combine(pf64, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                string.IsNullOrEmpty(pf86) ? "" : Path.Combine(pf86, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
                string.IsNullOrEmpty(pfW64) ? "" : Path.Combine(pfW64, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
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
            try
            {
                object val = Microsoft.Win32.Registry.GetValue(
                    @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe",
                    "", null);
                if (val != null)
                {
                    string p = val.ToString().Trim('"', ' ');
                    if (File.Exists(p)) return p;
                }
                val = Microsoft.Win32.Registry.GetValue(
                    @"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\firefox.exe",
                    "", null);
                if (val != null)
                {
                    string p = val.ToString().Trim('"', ' ');
                    if (File.Exists(p)) return p;
                }
            }
            catch { }

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
                string localAppDir = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                if (string.IsNullOrEmpty(localAppDir) || !Directory.Exists(localAppDir))
                {
                    localAppDir = Path.GetTempPath();
                }
                _tempProfileDir = Path.Combine(localAppDir, "Win11Sim_UserData_1AS");
                Directory.CreateDirectory(_tempProfileDir);
                try
                {
                    try
                    {
                        string defaultDir = Path.Combine(_tempProfileDir, "Default");
                        Directory.CreateDirectory(defaultDir);
                        string prefsFile = Path.Combine(defaultDir, "Preferences");
                        string prefsJson = "{" +
                            "\"credentials_enable_service\":false," +
                            "\"profile\":{\"password_manager_enabled\":false,\"password_manager_leak_detection\":false}," +
                            "\"autofill\":{\"credit_card_enabled\":false,\"profile_enabled\":false,\"address_enabled\":false}," +
                            "\"edge\":{\"autofill\":{\"password_manager_enabled\":false}}," +
                            "\"safebrowsing\":{\"enabled\":false,\"enhanced\":false}," +
                            "\"smartscreen\":{\"enabled\":false}," +
                            "\"download\":{\"prompt_for_download\":false,\"default_directory\":\"" + _exeDir.Replace("\\", "\\\\") + "\"}," +
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
                        "--disable-infobars " +
                        "--test-type " +
                        "--disable-hang-monitor " +
                        "--disable-prompt-on-repost " +
                        "--disable-save-password-bubble " +
                        "--disable-single-click-autofill " +
                        "--disable-autofill-keyboard-accessory-view " +
                        "--disable-password-generation " +
                        "--disable-password-manager-reauthentication " +
                        "--password-store=basic " +
                        "--disable-sync " +
                        "--disable-translate " +
                        "--disable-notifications " +
                        "--disable-popup-blocking " +
                        "--disable-client-side-phishing-detection " +
                        "--safebrowsing-disable-download-protection " +
                        "--safebrowsing-disable-auto-update " +
                        "--safebrowsing-disable-extension-blacklist " +
                        "--disable-component-update " +
                        "--disk-cache-size=20971520 " +
                        "--proxy-server=\"direct://\" " +
                        "--proxy-bypass-list=\"*\" " +
                        "--disable-features=msSmartScreenProtection,msSmartScreenPua,msSmartScreenPhishing,msDefenderSmartScreen,ScarewareBlockerProtectionEnabled,ScarewareBlockerBlocksDetectedSitesEnabled,msScarewareBlocker,msEdgeScarewareBlocker,SafetyHub,msEdgeStartupBoost,msStartupBoost,msPreemptiveLaunch,msEdgePreemptiveLaunch,Translate,msAccountSync,ChromeWhatsNewUI,PasswordManager,AutofillServerCommunication,AutofillAddressEnabled,AutofillCreditCardEnabled,msPasswordManager,msPasswordHealth,msWalletPasswordManager,msShowPasswordManagerOffer,OptimizationHints,MediaRouter " +
                        "--disable-background-mode " +
                        "--disable-backgrounding-occluded-windows " +
                        "--new-window " +
                        "--start-maximized",
                        url, _tempProfileDir);
                    psi.UseShellExecute = false;

                    Process p = Process.Start(psi);
                    _browserProcess = p;
                    ThreadPool.QueueUserWorkItem(delegate
                    {
                        Thread.Sleep(1500);
                        SplashScreen.Close();
                    });

                    DateTime launchTime = DateTime.UtcNow;
                    _lastPingUtc = DateTime.UtcNow;
                    _hasReceivedPing = false;

                    // Watchdog loop: Keeps loopback server alive without prematurely killing it during class sessions
                    while (_running)
                    {
                        if (!_running) break;

                        bool browserAlive = false;
                        try
                        {
                            if (p != null && !p.HasExited) browserAlive = true;
                        }
                        catch { }

                        if (!browserAlive)
                        {
                            // Primary process exited. Check if browser child process continues sending pings
                            if (_hasReceivedPing)
                            {
                                TimeSpan idle = DateTime.UtcNow - _lastPingUtc;
                                if (idle.TotalSeconds > 12)
                                {
                                    break;
                                }
                            }
                            else
                            {
                                TimeSpan waiting = DateTime.UtcNow - launchTime;
                                if (waiting.TotalSeconds > 90)
                                {
                                    break;
                                }
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
            try { SplashScreen.Close(); } catch { }
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
                    string lockFile = Path.Combine(_tempProfileDir, "lockfile");
                    if (File.Exists(lockFile)) File.Delete(lockFile);
                }
                catch { }
                _tempProfileDir = null;
            }
        }
    }
}
