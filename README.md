# DealDesk AI — Chat

A dedicated, minimalist commercial and residential mortgage underwriting chat website and universal embeddable drop-in widget.

## Universal Drop-In Code

To embed this chat anywhere on any website, simply paste this snippet into the HTML:

```html
<!-- DealDesk AI — Universal Mortgage Website Drop-In Script -->
<div id="loancity-ai-widget" data-title="DealDesk AI" data-division="auto"></div>
<script
  async
  src="https://DealDeskAI.com/widget.js"
  data-endpoint="https://DealDeskAI.com"
  data-title="DealDesk AI"
  data-division="auto"
></script>
```

### Configuration Attributes

| Attribute | Options | Description |
| :--- | :--- | :--- |
| `data-title` | String (Default: `"DealDesk AI"`) | Title displayed in the chat header and welcome message |
| `data-division` | `"auto"`, `"commercial"`, `"residential"`, `"realty"` | Target lending division preset |
| `data-endpoint` | URL (Default: `"https://DealDeskAI.com"`) | Back-end API endpoint for processing queries |

---

## Features

- **Dedicated Chat Website**: Full-height responsive layout styled for modern mortgage and fintech workflows.
- **Real-Time Debt Sizing & DSCR Modeling**: Instant calculation of debt service, debt yields, LTV, and maximum allowable loan amounts.
- **Mortgage Underwriting Knowledge**: Built-in guidelines for Multi-Family 5+ units, Commercial Real Estate, Non-QM, DSCR Investor loans, and Agency guidelines.
- **Document Review Support**: Dropzone and upload handler for rent rolls, T12 P&L, 1003 loan applications, and bank statements.
- **Offline & Standalone Resilience**: Automatically falls back to local calculations if the remote endpoint is unavailable or undergoing DNS configuration.
- **Zero Dependencies**: Pure HTML, modern CSS, and vanilla JavaScript.

---

## Running Locally

To run the chat website locally on your computer:

```bash
# Start the local server
node server.js
```

Open your browser and navigate to:
```
http://localhost:3000
```
