# GitIQ - Git Insight Web Application

GitIQ is a powerful web application that provides AI-powered insights into GitHub repositories. Analyze commit history, understand contributor patterns, and get intelligent summaries of your project's development with advanced commit categorization and filtering capabilities.

## ✨ Features

### 🔍 **Repository Analysis**
- Deep dive into any public GitHub repository
- Comprehensive commit history analysis
- Real-time data fetching with pagination support

### 🤖 **AI-Powered Commit Categorization**
- **Bulk Categorization**: Automatically categorize all commits with one click
- **19 Smart Categories**: bugfix, feature, refactor, documentation, test, chore, styling, performance, security, backend, frontend, database, API, UI, UX, build, ci/cd, dependencies, and other
- **Intelligent Analysis**: AI analyzes commit messages to determine primary purpose and impact
- **Fallback Logic**: Robust keyword-based categorization when AI is unavailable

### 📊 **Advanced Visual Analytics**
- **Interactive Category Chart**: Clean pie chart visualization with detailed breakdown list
- **Commit Activity Patterns**: Timeline analysis with smart aggregation (daily/weekly/monthly)
- **Contributor Statistics**: Detailed contributor analysis with commit counts and code changes
- **Color-Coded Categories**: Each category has unique colors and emoji icons for easy identification

### 🎛️ **Powerful Filtering & Search**
- **Category-Based Filtering**: Filter commits by multiple categories simultaneously
- **Prominent Category Filter**: Easy-to-access category selection above main content
- **Multi-Dimensional Filtering**: Combine category, author, date range, and message filters
- **Real-Time Results**: Instant filtering with live result updates

### 📝 **AI-Generated Insights**
- **Commit Pattern Summaries**: Intelligent analysis of development patterns
- **README Summarization**: AI-generated summaries of repository documentation
- **Individual Commit Explanations**: Detailed explanations for specific commits

### 🎨 **Modern User Experience**
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Intuitive Interface**: Clean, modern UI with logical information hierarchy
- **Dark/Light Theme Support**: Comfortable viewing in any environment
- **Fast Performance**: Built with Next.js 14 for optimal loading and interaction speeds

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Groq AI (Free tier available)
- **Charts**: Recharts for interactive data visualization
- **API**: GitHub REST API with comprehensive error handling
- **State Management**: React hooks with optimized state updates
- **Type Safety**: Full TypeScript support with strict type checking
- **UI Components**: Modern component library with accessibility features

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- GitHub Personal Access Token
- Groq API Key (Free)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd git-insight-web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
```

### Getting API Keys

#### GitHub Token
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with `public_repo` scope
3. Copy the token to your `.env.local` file

#### Groq API Key
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up for a free account
3. Create a new API key
4. Copy the key to your `.env.local` file

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### AI Testing

To test the AI integration:
```bash
npm run ai:test
```

This runs a simple test to verify the Groq AI connection is working.

## 🚀 Usage Guide

### Basic Workflow

1. **🔗 Enter Repository URL**: Paste any public GitHub repository URL into the input field
2. **📥 Fetch Data**: Click "Fetch Commits" to start the comprehensive analysis
3. **🤖 Categorize Commits**: Click "Categorize All Commits" to enable AI-powered categorization
4. **🎯 Filter & Explore**: Use the prominent category filter to focus on specific commit types

### 📊 Dashboard Features

#### **Commit History Tab**
- **Detailed Commit List**: View all commits with author info, timestamps, and messages
- **AI Insights**: Get explanations and categories for individual commits
- **Bulk Categorization**: Process all commits at once for comprehensive analysis
- **Advanced Filtering**: Filter by categories, authors, date ranges, and message content

#### **Activity Dashboard Tab**
- **Category Distribution**: Interactive pie chart with detailed breakdown list
- **Commit Activity Timeline**: Smart aggregation showing daily, weekly, or monthly patterns
- **Contributor Analysis**: Detailed statistics showing who contributed what and when
- **Visual Insights**: Color-coded categories with emoji icons for easy identification

### 🎛️ Advanced Filtering

#### **Category-Based Filtering** (Prominently displayed above tabs)
- **Multi-Select**: Choose multiple categories simultaneously
- **Real-Time Updates**: See results instantly as you select/deselect categories
- **Visual Indicators**: Color-coded badges show selected categories
- **Quick Actions**: Select all, clear all, or remove individual categories

#### **Traditional Filters** (Sidebar)
- **Author Filter**: Focus on specific contributors
- **Date Range**: Analyze commits within specific time periods
- **Message Search**: Find commits containing specific keywords
- **Sort Options**: Order by date or author, ascending or descending

### 💡 Pro Tips

1. **Start with Categorization**: Always categorize commits first to unlock the full potential of filtering and analytics
2. **Use Multiple Filters**: Combine category filters with date ranges for precise analysis
3. **Review Visual Insights**: Analyze the pie chart and detailed breakdown list for comprehensive understanding
4. **Load More Data**: Use "Load More Commits" for comprehensive analysis of larger repositories
5. **Individual Insights**: Click the AI insights button on individual commits for detailed explanations

## 📁 Project Structure

```
src/
├── app/                           # Next.js app directory
│   ├── globals.css               # Global styles and theme configuration
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Main application page with enhanced categorization
├── components/
│   ├── git-insights/             # GitIQ-specific components
│   │   ├── CategoryFilter.tsx    # 🆕 Advanced category filtering component
│   │   ├── CommitCategoriesChart.tsx # 🆕 Interactive category visualization
│   │   ├── CommitActivityChart.tsx   # Timeline activity analysis
│   │   ├── CommitItem.tsx        # Individual commit display with AI insights
│   │   ├── CommitList.tsx        # Commit list with filtering support
│   │   ├── ContributorList.tsx   # Contributor statistics
│   │   ├── Filters.tsx           # Traditional filtering options
│   │   ├── Header.tsx            # Application header
│   │   ├── ReadmeSummaryCard.tsx # AI-generated README summaries
│   │   ├── RepoForm.tsx          # Repository URL input
│   │   ├── RepoInfoCard.tsx      # Repository information display
│   │   ├── SummaryCard.tsx       # AI commit pattern summaries
│   │   └── WelcomePlaceholder.tsx # Welcome screen
│   └── ui/                       # Reusable UI components (shadcn/ui)
├── ai/
│   ├── flows/                    # AI flow definitions
│   │   ├── categorize-commit-flow.ts      # Individual commit categorization
│   │   ├── categorize-commits-bulk-flow.ts # 🆕 Bulk commit categorization
│   │   ├── explain-commit-message-flow.ts # Commit explanation generation
│   │   ├── summarize-frequent-changes.ts  # Pattern analysis
│   │   └── summarize-readme-flow.ts       # README summarization
│   ├── genkit.ts                 # Genkit configuration for AI integration
│   └── dev.ts                    # AI development and testing setup
├── lib/
│   ├── github.ts                 # 🔄 Enhanced GitHub API integration with categories
│   ├── server-actions.ts         # 🔄 Server actions with bulk categorization
│   └── utils.ts                  # Utility functions
├── types/
│   └── commit-categories.ts      # 🆕 Type definitions and category management
└── hooks/                        # Custom React hooks
    ├── use-mobile.tsx            # Mobile detection hook
    └── use-toast.ts              # Toast notification system
```

### 🆕 New Files Added
- **CategoryFilter.tsx**: Advanced multi-select category filtering with visual indicators
- **CommitCategoriesChart.tsx**: Interactive charts for category distribution analysis
- **categorize-commits-bulk-flow.ts**: AI flow for processing multiple commits efficiently
- **commit-categories.ts**: Comprehensive type system for category management

### 🔄 Enhanced Files
- **page.tsx**: Integrated category filtering prominently above tabs
- **github.ts**: Added category support to commit data structures
- **server-actions.ts**: Added bulk categorization server action

## 🤝 Contributing

We welcome contributions to GitIQ! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up your environment variables (see Getting Started section)
5. Make your changes and test thoroughly
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request with a detailed description

### Areas for Contribution
- 🐛 **Bug Fixes**: Help us identify and fix issues
- ✨ **New Features**: Propose and implement new functionality
- 📊 **Analytics**: Enhance data visualization and insights
- 🤖 **AI Improvements**: Optimize categorization accuracy and performance
- 🎨 **UI/UX**: Improve user interface and experience
- 📚 **Documentation**: Help improve documentation and examples
- 🧪 **Testing**: Add tests and improve code coverage

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure responsive design for all new UI components
- Test your changes across different screen sizes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Framework**: Built with [Next.js](https://nextjs.org/) for optimal performance
- **UI Components**: Beautiful components from [shadcn/ui](https://ui.shadcn.com/)
- **AI Integration**: Powered by [Groq](https://groq.com/) for fast and accurate AI processing
- **Icons**: Elegant icons from [Lucide](https://lucide.dev/)
- **Charts**: Interactive visualizations with [Recharts](https://recharts.org/)
- **Styling**: Modern styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Created by Dhruba Kr. Agarwalla (2411100)**

*GitIQ - Transforming repository analysis with AI-powered insights and intelligent commit categorization.*
