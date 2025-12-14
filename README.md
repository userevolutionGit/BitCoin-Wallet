# Zenith Bitcoin Wallet

A modern, secure Bitcoin wallet dashboard featuring real-time market visualization, transaction management, and an AI-powered crypto advisor using the Google Gemini API.

## Features

- **Dashboard**: View real-time Bitcoin balance, fiat value, and transaction history.
- **Send & Receive**: Simulate sending Bitcoin with AI risk analysis and generate receiving addresses.
- **AI Advisor**: Chat with "Zenith," an AI crypto expert powered by Google Gemini 2.5 Flash.
- **Bitcoin CLI**: A simulated terminal to execute Bitcoin Core RPC commands.
- **Airdrop Manager**: Batch send transactions to multiple contacts.
- **Wallet Import**: Import wallets using descriptors or seed phrases (simulated).

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- A [Google AI Studio](https://aistudio.google.com/) API Key.

## Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/userevolutionGit/BitCoinWallet.git
    cd BitCoinWallet
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    *   Rename the `env.txt` file to `.env`:
        ```bash
        mv env.txt .env
        ```
    *   Open `.env` and paste your Google Gemini API Key:
        ```env
        API_KEY=your_actual_api_key_here
        ```

## Running the App

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Charts**: Recharts
- **Icons**: Lucide React
