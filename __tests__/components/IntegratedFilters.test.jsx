import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IntegratedFilters from '../../components/IntegratedFilters';
import { FilterProvider } from '../../lib/context/FilterContext';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  },
}));

describe('IntegratedFilters - Collapsible Functionality', () => {
  const renderWithContext = (component) => {
    return render(
      <FilterProvider>
        {component}
      </FilterProvider>
    );
  };

  test('should render with collapsed state by default', () => {
    renderWithContext(<IntegratedFilters />);
    
    const heading = screen.getByText('Find Your Perfect GPU');
    expect(heading).toBeInTheDocument();
    
    // Check that content is hidden by default
    const contentDiv = document.getElementById('filter-content');
    expect(contentDiv).toHaveClass('max-h-0', 'opacity-0');
  });

  test('should expand when toggle button is clicked', async () => {
    renderWithContext(<IntegratedFilters />);
    
    // Find the toggle button (it contains the heading)
    const toggleButton = screen.getByRole('button', { expanded: false });
    
    // Click to expand
    fireEvent.click(toggleButton);
    
    // Check that content is now visible
    await waitFor(() => {
      const contentDiv = document.getElementById('filter-content');
      expect(contentDiv).toHaveClass('max-h-[2000px]', 'opacity-100');
    });
    
    // Check aria-expanded attribute
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('should collapse when toggle button is clicked again', async () => {
    renderWithContext(<IntegratedFilters />);
    
    const toggleButton = screen.getByRole('button', { expanded: false });
    
    // Expand
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
    
    // Collapse
    fireEvent.click(toggleButton);
    await waitFor(() => {
      const contentDiv = document.getElementById('filter-content');
      expect(contentDiv).toHaveClass('max-h-0', 'opacity-0');
    });
    
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should have chevron icon that rotates when expanded', async () => {
    renderWithContext(<IntegratedFilters />);
    
    const toggleButton = screen.getByRole('button', { expanded: false });
    const svg = toggleButton.querySelector('svg');
    
    // Initially not rotated
    expect(svg).not.toHaveClass('rotate-180');
    
    // Expand
    fireEvent.click(toggleButton);
    
    // Should be rotated after expansion
    await waitFor(() => {
      expect(svg).toHaveClass('rotate-180');
    });
  });

  test('should show Clear All button', () => {
    renderWithContext(<IntegratedFilters />);
    
    const clearButton = screen.getByText(/Clear All/i);
    expect(clearButton).toBeInTheDocument();
  });
});
