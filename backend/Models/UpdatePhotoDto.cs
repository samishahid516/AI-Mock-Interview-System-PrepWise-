namespace backend.Models;

public class UpdatePhotoDto
{
    // Base64 data URL, e.g. "data:image/jpeg;base64,...."
    public string PhotoUrl { get; set; } = string.Empty;
}
