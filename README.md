# Fragments Backend API

A secure Node.js microservice for managing user fragments with JWT authentication via AWS Cognito.

## Features

- **JWT Authentication**: Secure API endpoints using AWS Cognito User Pool
- **Environment Configuration**: Configurable via `.env` file
- **Structured Routes**: Organized API routes with versioning (`/v1/*`)
- **Error Handling**: Comprehensive error handling and logging
- **Security Middleware**: Helmet, CORS, and compression middleware
- **Unit Testing**: Comprehensive test suite with Jest and Supertest
- **Continuous Integration**: Automated testing and linting with GitHub Actions
- **Test Coverage**: Code coverage reporting for quality assurance

## Project Structure

```
fragments/
├── src/
│   ├── index.js          # Main entry point with env loading & error handling
│   ├── server.js         # Server startup and configuration
│   ├── app.js            # Express app setup and middleware
│   ├── response.js       # Response helper functions
│   ├── logger.js         # Logging configuration
│   ├── auth/             # Authentication strategies
│   │   ├── index.js      # Auth strategy selector
│   │   ├── cognito.js    # AWS Cognito JWT strategy
│   │   └── basic-auth.js # HTTP Basic Auth for testing
│   └── routes/
│       ├── index.js      # Main routes with authentication
│       └── api/
│           ├── index.js  # API v1 routes
│           └── get.js    # GET /v1/fragments endpoint
├── tests/
│   ├── .htpasswd         # Test user credentials
│   └── unit/             # Unit test files
│       ├── app.test.js   # App middleware tests
│       ├── health.test.js # Health check tests
│       ├── get.test.js   # API endpoint tests
│       └── response.test.js # Response helper tests
├── .github/workflows/
│   └── ci.yml            # GitHub Actions CI workflow
├── .env                  # Environment configuration
├── debug.env            # Debug environment variables
├── env.jest             # Test environment variables
├── jest.config.js       # Jest test configuration
└── package.json
```

## Prerequisites

- Node.js (v14 or higher)
- AWS Cognito User Pool configured
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mannatpreet22/Fragments.git
   cd Fragments
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your actual values:
   ```bash
   # Port for the server
   PORT=8080
   
   # Log level (debug, info, silent)
   LOG_LEVEL=debug
   
   # AWS Cognito Configuration
   AWS_COGNITO_POOL_ID=us-east-1_xxxxxxxxx
   AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **Important**: Replace the Cognito values with your actual User Pool ID and Client ID from AWS Console.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Debug Mode
```bash
npm run debug
```

## Testing

This project includes a comprehensive test suite using Jest and Supertest.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Generate coverage report:**
```bash
npm run coverage
```

**Run specific test file:**
```bash
npm test health.test.js
```

### Test Structure

- **Unit Tests**: Located in `tests/unit/`
- **Authentication**: Uses HTTP Basic Auth for testing (no AWS Cognito required)
- **Coverage**: Detailed coverage reports in `coverage/lcov-report/`

### Test Files

- `app.test.js` - Express app middleware and error handling
- `health.test.js` - Health check endpoint tests
- `get.test.js` - API endpoint authentication and response tests
- `response.test.js` - Response helper function tests

## Continuous Integration

This project uses GitHub Actions for automated testing and linting.

### CI Workflow

The `.github/workflows/ci.yml` workflow runs on:
- Push to `main` branch
- Pull requests to `main` branch

### CI Jobs

1. **ESLint**: Code linting and style checking
2. **Unit Tests**: Automated test execution

### Viewing CI Results

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. View workflow runs and their results

## Environment Configuration

### Development Environment
- Uses `debug.env` for development
- Debug logging enabled
- Hot reload with nodemon

### Test Environment
- Uses `env.jest` for testing
- Silent logging
- HTTP Basic Auth for authentication

### Production Environment
- Uses `.env` for production
- AWS Cognito authentication
- Structured logging

## API Endpoints

### Public Endpoints

#### Health Check
- **GET** `/`
- **Response**: Server status and metadata
- **Authentication**: None required

```bash
curl localhost:8080
```

**Response:**
```json
{
  "status": "ok",
  "author": "Your Name",
  "githubUrl": "https://github.com/yourusername/fragments",
  "version": "0.0.1"
}
```

### Protected Endpoints (Require JWT Authentication)

#### Get User Fragments
- **GET** `/v1/fragments`
- **Authentication**: Bearer token required
- **Headers**: `Authorization: Bearer <jwt-token>`

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" localhost:8080/v1/fragments
```

**Response:**
```json
{
  "status": "ok",
  "fragments": []
}
```

## Authentication

This API uses AWS Cognito for JWT token verification. All `/v1/*` endpoints require a valid JWT token in the Authorization header.

### Getting a JWT Token

1. **Via Web Application**: Use the fragments-ui web app to authenticate and get tokens
2. **Via AWS CLI**: Use AWS CLI to get tokens programmatically
3. **Via AWS Console**: Use the AWS Cognito console for testing

### Testing Authentication

**Without token (should return 401):**
```bash
curl localhost:8080/v1/fragments
```

**With invalid token (should return 401):**
```bash
curl -H "Authorization: Bearer invalid-token" localhost:8080/v1/fragments
```

**With valid token (should return 200):**
```bash
curl -H "Authorization: Bearer YOUR_VALID_JWT_TOKEN" localhost:8080/v1/fragments
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 8080 | No |
| `LOG_LEVEL` | Logging level (debug, info, silent) | debug | No |
| `AWS_COGNITO_POOL_ID` | AWS Cognito User Pool ID | - | Yes |
| `AWS_COGNITO_CLIENT_ID` | AWS Cognito Client App ID | - | Yes |

## Logging

The application uses structured logging with different levels:

- **debug**: Detailed information for debugging
- **info**: General information about application flow
- **error**: Error conditions
- **fatal**: Critical errors that may cause the application to crash

Logs include:
- Request/response information
- Authentication events
- Error details
- Server startup/shutdown events

## Security Features

- **JWT Token Verification**: All protected endpoints verify JWT tokens with AWS Cognito
- **Helmet.js**: Security headers and protection against common vulnerabilities
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Secure error responses without sensitive information exposure

## Development

### Project Setup Changes

This project was restructured to use a new entry point and authentication system:

1. **New Entry Point**: Changed from `src/server.js` to `src/index.js`
2. **Environment Loading**: Added dotenv configuration for environment variables
3. **Error Handling**: Added global error handlers for uncaught exceptions
4. **Route Structure**: Organized routes into separate files and directories
5. **Authentication**: Integrated Passport.js with AWS Cognito JWT verification

### Key Dependencies

**Production Dependencies:**
- **express**: Web framework
- **passport**: Authentication middleware
- **passport-http-bearer**: Bearer token strategy
- **aws-jwt-verify**: AWS Cognito JWT verification
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **compression**: Response compression
- **pino**: Structured logging
- **http-auth**: HTTP Basic Authentication
- **http-auth-passport**: Passport integration for Basic Auth

**Development Dependencies:**
- **jest**: Testing framework
- **supertest**: HTTP assertion library
- **eslint**: Code linting
- **prettier**: Code formatting

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that you're providing a valid JWT token
2. **Cognito JWKS Error**: Verify your AWS Cognito configuration
3. **Port Already in Use**: Change the PORT in your `.env` file
4. **Missing Environment Variables**: Ensure all required variables are set in `.env`

### Debug Mode

Run in debug mode to see detailed logs:
```bash
npm run debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.
