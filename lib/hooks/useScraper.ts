export function useScraper() {
  const scrapeProvider = async (provider: string, dryRun = false) => {
    try {
      const response = await fetch(
        `/api/scrape?provider=${provider}&dryRun=${dryRun}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error scraping ${provider}:`, error);
      throw error;
    }
  };

  return { scrapeProvider };
} 