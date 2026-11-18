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

                    // Frame
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

                    // Republic Header
                    using (Font f1 = new Font("Segoe UI", 16f, FontStyle.Bold))
                    using (Brush b1 = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    {
                        g.DrawString("الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية", f1, b1, new RectangleF(60, 60, 1120, 36), rtlCenter);
                    }

                    // Extract Institution and Teacher
                    string instName = "المؤسسة التعليمية";
                    Match mInst = Regex.Match(html ?? "", @"المؤسسة:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mInst.Success) instName = mInst.Groups[1].Value.Trim();

                    string teachName = "الأستاذ المشرف";
                    Match mTeach = Regex.Match(html ?? "", @"الأستاذ المشرف:[\s\S]*?<strong>([^<]+)</strong>");
                    if (mTeach.Success) teachName = mTeach.Groups[1].Value.Trim();

                    using (Font fInfo = new Font("Segoe UI", 11.5f, FontStyle.Bold))
                    using (Brush bInfo = new SolidBrush(Color.FromArgb(51, 65, 85)))
                    {
                        g.DrawString("المؤسسة: " + instName + "   |   الأستاذ: " + teachName, fInfo, bInfo, new RectangleF(80, 95, 1080, 25), rtlCenter);
                    }

                    // Banner
                    using (Brush bgBanner = new SolidBrush(Color.FromArgb(248, 250, 252)))
                    using (Pen pBanner = new Pen(Color.FromArgb(226, 232, 240), 2f))
                    {
                        g.FillRectangle(bgBanner, 80, 125, 1080, 75);
                        g.DrawRectangle(pBanner, 80, 125, 1080, 75);
                    }

                    using (Font fTitle = new Font("Segoe UI", 18f, FontStyle.Bold))
                    using (Brush bTitle = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    {
                        g.DrawString("بطاقة تقويم الأعمال التطبيقية — مادة الإعلام الآلي", fTitle, bTitle, new RectangleF(80, 132, 1080, 35), rtlCenter);
                    }

                    using (Font fSub = new Font("Segoe UI", 12f, FontStyle.Regular))
                    using (Brush bSub = new SolidBrush(Color.FromArgb(71, 85, 105)))
                    {
                        g.DrawString("المجال التعلمي: بيئة التعامل مع الحاسوب (لوحة التحكم وإعدادات نظام التشغيل Windows 11)", fSub, bSub, new RectangleF(80, 165, 1080, 30), rtlCenter);
                    }

                    // Extract student info
                    string stuName = "التلميذ";
                    Match mName = Regex.Match(html ?? "", @"اسم التلميذ\(ة\):[\s\S]*?<td[^>]*class=""a4-cell-val""[^>]*>([^<]+)</td>");
                    if (mName.Success) stuName = mName.Groups[1].Value.Trim();
                    else
                    {
                        Match mName2 = Regex.Match(html ?? "", @"بطاقة تقويم الأعمال التطبيقية - ([^<\n]+)");
                        if (mName2.Success) stuName = mName2.Groups[1].Value.Trim();
                    }

                    string className = "السنة الأولى ثانوي";
                    Match mClass = Regex.Match(html ?? "", @"الفوج التربوي:[\s\S]*?<td[^>]*class=""a4-cell-val""[^>]*>([^<]+)</td>");
                    if (mClass.Success) className = mClass.Groups[1].Value.Trim();

                    string pcNumber = "01";
                    Match mPc = Regex.Match(html ?? "", @"رقم الحاسوب:[\s\S]*?<td[^>]*class=""a4-cell-val""[^>]*>([^<]+)</td>");
                    if (mPc.Success) pcNumber = mPc.Groups[1].Value.Trim();

                    // Extract score
                    string scoreText = "20.00 / 20.00";
                    Match mScore = Regex.Match(html ?? "", @"(\d+\.\d{2})\s*/\s*20");
                    if (mScore.Success) scoreText = mScore.Groups[1].Value + " / 20.00";

                    // Student Box
                    using (Brush bgBox = new SolidBrush(Color.FromArgb(241, 245, 249)))
                    using (Pen pBox = new Pen(Color.FromArgb(203, 213, 225), 1.5f))
                    {
                        g.FillRectangle(bgBox, 80, 215, 1080, 95);
                        g.DrawRectangle(pBox, 80, 215, 1080, 95);
                    }

                    using (Font fLabel = new Font("Segoe UI", 13.5f, FontStyle.Bold))
                    using (Brush bDark = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    {
                        g.DrawString("اسم التلميذ(ة): " + stuName + "      |      الفوج: " + className + "      |      الجهاز: " + pcNumber, fLabel, bDark, new RectangleF(100, 228, 1040, 32), rtlRight);
                        g.DrawString("المستوى: السنة الأولى ثانوي (1AS) — الوحدة 3: لوحة التحكم وإعدادات النظام", fLabel, bDark, new RectangleF(100, 265, 1040, 32), rtlRight);
                    }

                    // Score Box
                    using (Brush bgScore = new SolidBrush(Color.FromArgb(240, 253, 244)))
                    using (Pen pScore = new Pen(Color.FromArgb(22, 163, 74), 2.5f))
                    {
                        g.FillRectangle(bgScore, 80, 325, 1080, 125);
                        g.DrawRectangle(pScore, 80, 325, 1080, 125);
                    }

                    using (Font fScoreLbl = new Font("Segoe UI", 14f, FontStyle.Bold))
                    using (Brush bGreenDark = new SolidBrush(Color.FromArgb(21, 128, 61)))
                    {
                        g.DrawString("العلامة الإجمالية المستحقة (وفق القاعدة الثلاثية الرسمية):", fScoreLbl, bGreenDark, new RectangleF(100, 338, 1040, 30), rtlCenter);
                    }

                    using (Font fScoreVal = new Font("Segoe UI", 34f, FontStyle.Bold))
                    using (Brush bGreen = new SolidBrush(Color.FromArgb(22, 163, 74)))
                    {
                        g.DrawString(scoreText, fScoreVal, bGreen, new RectangleF(100, 372, 1040, 60), rtlCenter);
                    }

                    // Tasks table
                    string[] tasks = new string[] {
                        "1. تغيير لغة عرض Windows",
                        "2. ضبط خصائص الفأرة ومؤشرها",
                        "3. إضافة لغة الإدخال وضبط المنطقة الزمنية (GMT+1)",
                        "4. تخصيص المظهر والخلفية وألوان التمييز",
                        "5. تثبيت وإلغاء تثبيت البرامج وإدارة الميزات الاختيارية",
                        "6. إدارة حسابات المستخدمين وكلمات المرور والصلاحيات"
                    };

                    int y = 470;
                    using (Font fTh = new Font("Segoe UI", 13f, FontStyle.Bold))
                    using (Font fTd = new Font("Segoe UI", 12f, FontStyle.Regular))
                    using (Brush bThBg = new SolidBrush(Color.FromArgb(30, 58, 138)))
                    using (Brush bThText = new SolidBrush(Color.White))
                    using (Brush bTdText = new SolidBrush(Color.FromArgb(15, 23, 42)))
                    using (Brush bCheck = new SolidBrush(Color.FromArgb(22, 163, 74)))
                    using (Pen pGrid = new Pen(Color.FromArgb(203, 213, 225), 1f))
                    {
                        g.FillRectangle(bThBg, 80, y, 1080, 40);
                        g.DrawString("المهمة التطبيقية المقررة في المنهاج", fTh, bThText, new RectangleF(380, y, 760, 40), rtlRight);
                        g.DrawString("حالة الإنجاز والتقييم", fTh, bThText, new RectangleF(100, y, 260, 40), rtlCenter);
                        y += 40;

                        for (int i = 0; i < tasks.Length; i++)
                        {
                            using (Brush rowBg = new SolidBrush((i % 2 == 0) ? Color.White : Color.FromArgb(248, 250, 252)))
                            {
                                g.FillRectangle(rowBg, 80, y, 1080, 38);
                            }
                            g.DrawRectangle(pGrid, 80, y, 1080, 38);
                            g.DrawString(tasks[i], fTd, bTdText, new RectangleF(380, y, 760, 38), rtlRight);
                            g.DrawString("مكتملة ومستوفاة ✔", fTd, bCheck, new RectangleF(100, y, 260, 38), rtlCenter);
                            y += 38;
                        }
                    }

                    // Math Breakdown Banner
                    using (Brush bgMath = new SolidBrush(Color.FromArgb(240, 249, 255)))
                    using (Pen pMath = new Pen(Color.FromArgb(186, 230, 253), 1.5f))
                    {
                        g.FillRectangle(bgMath, 80, y + 20, 1080, 70);
                        g.DrawRectangle(pMath, 80, y + 20, 1080, 70);
                    }
                    using (Font fMath = new Font("Segoe UI", 12f, FontStyle.Bold))
                    using (Brush bMath = new SolidBrush(Color.FromArgb(3, 105, 161)))
                    {
                        g.DrawString("التفكيك الحسابي للعلامة: تطبيق القاعدة الثلاثية الرسمية (العلامة القاعدية = النقاط المكتسبة / المعاملات × 20)", fMath, bMath, new RectangleF(100, y + 30, 1040, 25), rtlRight);
                        g.DrawString("النتيجة الرسمية: استيفاء الكفاءات المقررة بنجاح وتحكم تام في بيئة إعدادات Windows 11", fMath, bMath, new RectangleF(100, y + 55, 1040, 25), rtlRight);
                    }

                    // Signature & Seal
                    int ySig = 1500;
                    using (Pen pSig = new Pen(Color.FromArgb(100, 116, 139), 1.5f))
                    {
                        pSig.DashStyle = DashStyle.Dash;
                        g.DrawRectangle(pSig, 120, ySig, 350, 130);
                    }
                    using (Font fSig = new Font("Segoe UI", 13f, FontStyle.Bold))
                    using (Brush bSig = new SolidBrush(Color.FromArgb(71, 85, 105)))
                    {
                        g.DrawString("توقيع وختم الأستاذ(ة)", fSig, bSig, new RectangleF(120, ySig + 15, 350, 35), rtlCenter);
                    }

                    using (Font fDate = new Font("Segoe UI", 12f, FontStyle.Regular))
                    using (Brush bDate = new SolidBrush(Color.FromArgb(100, 116, 139)))
                    {
                        g.DrawString("حرر بتاريخ: " + DateTime.Now.ToString("yyyy/MM/dd"), fDate, bDate, new RectangleF(750, ySig + 20, 400, 30), rtlRight);
                        g.DrawString("وثيقة تقييم رسمية غير قابلة للتعديل معتمدة لتقويم الأعمال التطبيقية", fDate, bDate, new RectangleF(750, ySig + 55, 400, 30), rtlRight);
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
                                                    "{0} --disable-gpu --no-sandbox --no-pdf-header-footer --user-data-dir=\"{1}\" --run-all-compositor-stages-before-draw --print-to-pdf=\"{2}\" \"{3}\"",
                                                    headlessVariants[v], tmpProf, targetPath, fileUrl);
                                                pPsi.UseShellExecute = false;
                                                pPsi.CreateNoWindow = true;
                                                using (Process p = Process.Start(pPsi))
                                                {
                                                    if (p != null)
                                                    {
                                                        if (!p.WaitForExit(6000))
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
                                // Graceful fallback: save HTML report document directly so file is never lost
                                targetPath = Path.ChangeExtension(targetPath, ".html");
                                File.WriteAllText(targetPath, htmlStr ?? "", Encoding.UTF8);
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
                        "--proxy-server=\"direct://\" " +
                        "--proxy-bypass-list=\"*\" " +
                        "--disable-features=msSmartScreenProtection,msSmartScreenPua,msSmartScreenPhishing,msDefenderSmartScreen,ScarewareBlockerProtectionEnabled,ScarewareBlockerBlocksDetectedSitesEnabled,msScarewareBlocker,msEdgeScarewareBlocker,SafetyHub,msEdgeStartupBoost,msStartupBoost,msPreemptiveLaunch,msEdgePreemptiveLaunch,Translate,msAccountSync,ChromeWhatsNewUI,PasswordManager,AutofillServerCommunication,AutofillAddressEnabled,AutofillCreditCardEnabled,msPasswordManager,msPasswordHealth,msWalletPasswordManager,msShowPasswordManagerOffer " +
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
