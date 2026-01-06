// Service for handling iframe viewer URLs
export const viewerService = {
  /**
   * Generate iframe viewer URL for a given S3 URL
   */
  getViewerUrl(s3Url: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/iframe-viewer?url=${encodeURIComponent(s3Url)}`;
  },

  /**
   * Open viewer in new tab/window
   */
  openViewer(s3Url: string): void {
    const viewerUrl = this.getViewerUrl(s3Url);
    window.open(viewerUrl, '_blank');
  },

  /**
   * Navigate to viewer in current window
   */
  navigateToViewer(s3Url: string): void {
    const viewerUrl = this.getViewerUrl(s3Url);
    window.location.href = viewerUrl;
  }
};