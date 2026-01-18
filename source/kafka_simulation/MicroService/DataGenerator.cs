using System.Text;
using Microsoft.VisualBasic;
namespace MicroService;

public enum PayloadMode
{
    Leicht,
    Mittel,
    Schwer
}


public class DataGenerator
{
    private static readonly Random _random = new();

    public static string Generate(PayloadMode mode)
    {
        var (tag, targetBytes) = mode switch
        {
            PayloadMode.Leicht => ("LEICHT", 128),
            PayloadMode.Mittel => ("MITTEL", 512),
            PayloadMode.Schwer => ("SCHWER", 1024),
            _ => throw new ArgumentOutOfRangeException(nameof(mode))
        };

        // Prefix inkl. Trennzeichen
        var prefix = $"{tag}|";
        var prefixBytes = Encoding.UTF8.GetByteCount(prefix);

        // Zielgröße minus Prefix
        var remainingBytes = Math.Max(0, targetBytes - prefixBytes);

        // ASCII → 1 Zeichen = 1 Byte (einfach & kontrollierbar)
        var payload = GenerateRandomAsciiString(remainingBytes);

        return prefix + "____" + payload;
    }

    private static string GenerateRandomAsciiString(int byteCount)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        var sb = new StringBuilder(byteCount);

        for (int i = 0; i < byteCount; i++)
        {
            sb.Append(chars[_random.Next(chars.Length)]);
        }

        return sb.ToString();
    }

    public static int GetByteCount(string text)
    {
        return Encoding.UTF8.GetByteCount(text);
    }
}