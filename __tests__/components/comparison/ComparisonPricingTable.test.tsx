import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComparisonPricingTable from '@/components/comparison/ComparisonPricingTable'

const buildInitialData = () => ({
  provider1: { id: 'provider-1', name: 'Amazon AWS', slug: 'aws' },
  provider2: { id: 'provider-2', name: 'Lambda Labs', slug: 'lambda-labs' },
  metadata: {
    totalGPUs: 2,
    provider1Available: 2,
    provider2Available: 2,
    bothAvailable: 2,
    fetchedAt: '2025-11-25T09:42:18.000Z',
  },
  comparisonData: [
    {
      gpu_model_id: 'gpu-alpha',
      gpu_model_name: 'A10',
      vram: 24,
      manufacturer: 'NVIDIA',
      provider1: {
        provider_slug: 'aws',
        provider_name: 'Amazon AWS',
        price_per_hour: 1.63,
        gpu_count: 1,
        source_name: 'AWS',
        source_url: 'https://aws.amazon.com',
      },
      provider2: {
        provider_slug: 'lambda-labs',
        provider_name: 'Lambda Labs',
        price_per_hour: 0.75,
        gpu_count: 1,
        source_name: 'Lambda Labs',
        source_url: 'https://lambdalabs.com',
      },
      price_difference: 0.88,
      price_difference_percent: 117.3,
      best_price: 'provider2',
      availability: { provider1: true, provider2: true },
    },
    {
      gpu_model_id: 'gpu-beta',
      gpu_model_name: 'B200',
      vram: 192,
      manufacturer: 'NVIDIA',
      provider1: {
        provider_slug: 'aws',
        provider_name: 'Amazon AWS',
        price_per_hour: 10.58,
        gpu_count: 1,
        source_name: 'AWS',
        source_url: 'https://aws.amazon.com',
      },
      provider2: {
        provider_slug: 'lambda-labs',
        provider_name: 'Lambda Labs',
        price_per_hour: 39.92,
        gpu_count: 8,
        source_name: 'Lambda Labs',
        source_url: 'https://lambdalabs.com',
      },
      price_difference: -29.34,
      price_difference_percent: -73.5,
      best_price: 'provider1',
      availability: { provider1: true, provider2: true },
    },
  ],
})

describe('ComparisonPricingTable', () => {
  test('renders initialData without filters and shows counts', () => {
    render(
      <ComparisonPricingTable
        provider1Id="provider-1"
        provider2Id="provider-2"
        provider1Name="Amazon AWS"
        provider2Name="Lambda Labs"
        initialData={buildInitialData()}
      />
    )

    expect(screen.getByText('Total GPUs: 2')).toBeInTheDocument()
    expect(screen.getByText('Both available: 2')).toBeInTheDocument()
    expect(screen.getByText(/Showing 2 of 2 GPUs/)).toBeInTheDocument()
    expect(screen.queryByText(/Comparison Filters/i)).not.toBeInTheDocument()
    expect(screen.getAllByText('A10').length).toBeGreaterThan(0)
    expect(screen.getAllByText('B200').length).toBeGreaterThan(0)
  })

  test('sorts by price difference when header is clicked', async () => {
    render(
      <ComparisonPricingTable
        provider1Id="provider-1"
        provider2Id="provider-2"
        provider1Name="Amazon AWS"
        provider2Name="Lambda Labs"
        initialData={buildInitialData()}
      />
    )

    const user = userEvent.setup()
    const table = screen.getAllByRole('table')[0]
    const priceDiffHeader = within(table)
      .getAllByRole('columnheader')
      .find((cell) => within(cell).queryByText(/Price Diff/i))

    if (!priceDiffHeader) {
      throw new Error('Price Diff header not found')
    }

    // Click once to sort by price_difference asc
    await user.click(priceDiffHeader)

    const rows = within(table).getAllByRole('row')
    const dataRows = rows.filter((row) => {
      const hasHeader = within(row).queryAllByRole('columnheader').length > 0
      const hasMobilePriceDiff = within(row).queryByText(/Price Difference:/i)
      return !hasHeader && !hasMobilePriceDiff
    })
    const firstRowText = dataRows[0].textContent || ''

    expect(firstRowText).toMatch(/B200|A10/)
    // After sorting asc by price_difference, the more negative value (B200) should rise to the top
    expect(firstRowText).toContain('B200')
  })
})
