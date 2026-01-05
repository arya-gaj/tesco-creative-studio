# Local Setup Instructions

## Introduction

Clubcard Points Bandit Labs is a full-stack application that requires local **back-end** setup for AI model execution. While the **front-end** can be hosted on Vercel, the **back-end** must run locally because it uses CPU-based Stable Diffusion for image generation, which requires direct access to your machine's resources and cannot run in serverless environments. The **back-end** handles AI-powered asset recommendations via Claude API, local image generation, and serves the product asset library. This guide provides step-by-step instructions to set up and run the complete system on your local machine.

Note: Due to file size limitations, the complete source code cannot be uploaded directly. Please download or clone the full project from the attached GitHub repository and follow the local setup instructions below to run the application.

## Prerequisites

Install Python 3.8 or higher from python.org. During installation, check "Add Python to PATH".

Install Node.js 16 or higher from nodejs.org (includes npm). Choose the LTS version.

Get an Anthropic Claude API key from console.anthropic.com. Sign up, navigate to API Keys, create a new key, and copy it (starts with sk-ant-...).

## Setup Instructions

### Step 1: Back-end Setup

Navigate to the **back-end** directory in your terminal.

Create a Python virtual environment:

* Windows: python -m venv venv
* Mac/Linux: python3 -m venv venv

Activate the virtual environment:

* Windows Command Prompt: venv\Scripts\activate
* Windows PowerShell: venv\Scripts\Activate.ps1
* Mac/Linux: source venv/bin/activate

Install Python dependencies: pip install -r requirements.txt

Install background removal library: pip install "rembg[cpu]"

### Step 2: Configure API Key

Create a file named .env in the **back-end** directory.

Add this line to the file, replacing your_api_key_here with your actual Claude API key:
ANTHROPIC_API_KEY=your_api_key_here

Save the file. The .env file should be in the **back-end** folder, not the root project folder.

### Step 3: Front-end Setup

Navigate to the **front-end** directory in your terminal.

Install Node.js dependencies: npm install

Wait for installation to complete. This creates a node_modules folder with all required libraries.

### Step 4: Start the Back-end Server

Navigate to the **back-end** directory.

Activate the virtual environment (same as Step 1).

Run the **back-end** server: python main.py

The server starts on [http://localhost:8000](http://localhost:8000). The first run downloads Stable Diffusion models (approximately 4GB), which takes 2–5 minutes. Keep this terminal window open while using the application.

Verify the **back-end** is running by visiting [http://localhost:8000/health](http://localhost:8000/health) in your browser. You should see a JSON response with status "healthy".

### Step 5: Start the Front-end Server

Open a new terminal window (keep the **back-end** terminal running).

Navigate to the **front-end** directory.

Start the development server: npm run dev

The **front-end** starts on [http://localhost:5173](http://localhost:5173). The terminal will display the exact URL.

### Step 6: Access the Application

Open your web browser and navigate to [http://localhost:5173](http://localhost:5173).

You should see the Clubcard Points Bandit Labs interface with a prompt input, asset library panel, and canvas area.

## Why Local Back-end is Required

The **back-end** must run locally because:

1. Stable Diffusion models are large (4GB+) and require significant memory and processing power that serverless platforms cannot provide efficiently.

2. CPU-based image generation needs direct hardware access. Running on your local machine allows the models to use your CPU cores effectively without the latency and limitations of cloud serverless functions.

3. The asset library (935 product images) is served directly from your local file system, which is faster and more reliable than cloud storage for development and testing.

4. Local execution ensures privacy and control over AI model usage, with no data leaving your machine except for Claude API calls (which only send text prompts, not images).

5. Cost efficiency: Running AI models locally is free, whereas cloud GPU instances would incur significant costs for continuous operation.

The **front-end** can be hosted on Vercel for public access, but users must run the **back-end** locally to generate creatives. This hybrid architecture provides the best balance of accessibility and performance.

## Usage

Enter a creative prompt in the text input field, such as "breakfast cereal products" or "summer clothing collection".

Click the generate button. The system will normalize your prompt using Claude API, recommend 8 relevant product assets, and generate a background image using Stable Diffusion (takes 30–60 seconds on CPU).

Once generation completes, you'll see 8 product assets in the asset library panel and a generated background on the canvas.

Drag assets from the library onto the canvas, or click an asset to automatically place it with strategic positioning.

Use the select tool or Shift+Left-click to move items around the canvas.

Use the background removal tool if you need to remove white backgrounds from product images.

Click the download button to save your final creative as a PNG file.

## Troubleshooting

If you see "ModuleNotFoundError", make sure you activated the virtual environment and installed requirements.txt.

If you see "ANTHROPIC_API_KEY not set", verify your .env file exists in the **back-end** folder with the correct API key.

If port 8000 is already in use, find and close the process using that port. On Windows: netstat -ano | findstr :8000, then taskkill /PID  /F. On Mac/Linux: lsof -ti:8000 | xargs kill.

If assets are not loading, verify the asset-library folder exists with .jpg files and asset-index.csv exists in the project root directory.

If image generation is slow, this is normal on CPU. Background generation typically takes 30–60 seconds. The first startup takes longer as models load into memory.

If only 1 asset shows instead of 8, check the **back-end** terminal logs, verify your API key is correct, and restart the **back-end** server.

## Stopping the Application

To stop the **back-end** server, go to the **back-end** terminal and press Ctrl+C.

To stop the **front-end** server, go to the **front-end** terminal and press Ctrl+C.

Both servers must be stopped when you're done using the application.
