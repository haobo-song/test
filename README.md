# Stock Market Dashboard

A modern stock market dashboard built with FastAPI and React, featuring historical price data visualization for major tech stocks and the S&P 500 index.

## Features

- Historical stock price data for the past year
- Dark-themed, modern UI with Tremor components
- Interactive price charts and market overview
- Support for multiple stocks including S&P 500
- Daily price updates and volume information

## Tech Stack

### Backend
- FastAPI
- Python 3.8+
- Yahoo Finance API

### Frontend
- React
- TypeScript
- Tremor Components
- Tailwind CSS
- Vite

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/test.git
cd test
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend/app
uvicorn main:app --reload
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to http://localhost:5173 