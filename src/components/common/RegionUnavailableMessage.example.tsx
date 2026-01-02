/**
 * RegionUnavailableMessage - Usage Examples
 *
 * Demonstrates different configurations of the RegionUnavailableMessage component.
 */

import { Component } from 'solid-js';
import { RegionUnavailableMessage } from './RegionUnavailableMessage';

export const RegionUnavailableExamples: Component = () => {
  return (
    <div
      style={{
        padding: '40px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '32px',
        'max-width': '800px',
        margin: '0 auto',
        background: '#f8f9fa',
        'min-height': '100vh',
      }}
    >
      <h1 style={{ 'font-family': "'Space Grotesk', sans-serif", margin: '0' }}>
        RegionUnavailableMessage Examples
      </h1>

      {/* Example 1: Full Mode with All Features */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Full Mode (Default)
        </h2>
        <RegionUnavailableMessage countryCode="CA" countryName="Canada" />
      </section>

      {/* Example 2: Full Mode without Region List */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Full Mode - Without Region List
        </h2>
        <RegionUnavailableMessage
          countryCode="JP"
          countryName="Japan"
          showSupportedRegions={false}
        />
      </section>

      {/* Example 3: Compact Mode */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Compact Mode
        </h2>
        <RegionUnavailableMessage countryCode="GB" countryName="United Kingdom" compact />
      </section>

      {/* Example 4: Custom Message */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Custom Message
        </h2>
        <RegionUnavailableMessage
          countryCode="DE"
          countryName="Germany"
          customMessage="Labor market insights are currently limited to the United States. We're actively working to bring comprehensive job market data to your region."
          showSupportedRegions={false}
        />
      </section>

      {/* Example 5: Inline Usage (Compact) */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Inline Usage Example
        </h2>
        <div
          style={{
            padding: '20px',
            background: 'white',
            'border-radius': '12px',
            border: '1px solid #e0e0e0',
          }}
        >
          <h3 style={{ 'font-family': "'Space Grotesk', sans-serif", margin: '0 0 16px 0' }}>
            Salary Insights
          </h3>
          <RegionUnavailableMessage countryCode="AU" countryName="Australia" compact />
        </div>
      </section>

      {/* Example 6: Multiple Languages/Countries */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Different Countries
        </h2>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <RegionUnavailableMessage countryCode="FR" countryName="France" compact />
          <RegionUnavailableMessage countryCode="IN" countryName="India" compact />
          <RegionUnavailableMessage countryCode="BR" countryName="Brazil" compact />
        </div>
      </section>

      {/* Example 7: In a Card Context */}
      <section>
        <h2 style={{ 'font-family': "'Space Grotesk', sans-serif", 'margin-bottom': '12px' }}>
          Within a Feature Card
        </h2>
        <div
          style={{
            padding: '24px',
            background: 'white',
            'border-radius': '16px',
            border: '1px solid #e0e0e0',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <h3
            style={{
              'font-family': "'Space Grotesk', sans-serif",
              margin: '0 0 8px 0',
              'font-size': '18px',
            }}
          >
            Market Trends Analysis
          </h3>
          <p
            style={{
              margin: '0 0 16px 0',
              color: '#666',
              'line-height': '1.6',
              'font-size': '14px',
            }}
          >
            View comprehensive hiring trends, seasonal patterns, and demand forecasts for your
            target roles.
          </p>
          <RegionUnavailableMessage countryCode="MX" countryName="Mexico" />
        </div>
      </section>
    </div>
  );
};

export default RegionUnavailableExamples;
