# Shopping Cart API - Paystack Future Stack Assessment

A RESTful API for a shopping cart system built with Node.js, TypeScript, Express, and MySQL using Prisma ORM.

## 🚀 Features

### Products Management
- ✅ Create, read, update, and delete products
- ✅ Product categorization with auto-generated SKUs
- ✅ Stock level management
- ✅ Search and filtering capabilities
- ✅ Pagination support
- ✅ **Idempotent product creation** with duplicate prevention

### Shopping Cart
- ✅ Add items to cart with quantity validation
- ✅ Update item quantities with stock validation
- ✅ Remove items from cart
- ✅ View cart with product details and subtotalKobo
- ✅ Business rule: Users cannot add their own products to cart
- ✅ Dual pricing: Both kobo (unit price) and naira values

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ Protected routes for cart and product management

### API Documentation
- ✅ Complete Swagger/OpenAPI documentation
- ✅ Interactive API explorer at `/api/swagger`
- ✅ Documentation json at `/api/swagger/json`

## 🛠 Tech Stack

- **Main**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Security**: Helmet, CORS

## 📋 Prerequisites

- Node.js (v18 or later)
- MySQL (v8.0 or later)
- yarn (npm can be used too, but will generate new package-lock.json)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Aphatheology/future-stack-assessment
cd future-stack-assessment
yarn install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/shopping_cart_db"

# JWT
JWT_ACCESS_TOKEN_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE="15"
JWT_REFRESH_TOKEN_SECRET="your-refresh-secret"
JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS="7d"

# Server
PORT=3000
NODE_ENV="development"
SERVER_URL="http://localhost:3000"
CLIENT_URL="http://localhost:5172"
```

### 3. Database Setup

```bash
# Generate Prisma client
yarn generate:prisma

# Run database migrations
yarn db:deploy

# Seed the database with sample data
yarn seed
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
yarn dev

# Production build and start
yarn build
yarn start
```

The API will be available at `http://localhost:3000`
The base url is `http://localhost:3000/api/v1`

## 📚 API Documentation

Visit `http://localhost:3000/api/swagger` for the interactive Swagger documentation.
Or `https://localhost:3000/api/swagger/json` for the JSON version, which can be used with tools like Postman.

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh user's access token
- `POST /auth/logout` - Logout user

### Product Endpoints
- `GET /products` - List products (public)
- `GET /products/my-products` - Get authenticated user's products
- `POST /products` - Create product (authenticated)
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product (owner only)
- `DELETE /products/:id` - Delete product (owner only)

### Cart Endpoints
- `GET /cart` - Get user's cart
- `POST /cart` - Add item to cart
- `PUT /cart/:productId` - Update item quantity
- `DELETE /cart/:productId` - Remove item from cart

### Categories Endpoints
- `GET /categories` - Get all categories in the system

## 🏗 Architecture & Design Decisions

### Database Design
- **Users && UserSessions**: Store user authentication and profile data
- **Categories**: Product categories
- **Products**: Product information with stock levels
- **Cart & CartItems**: User shopping cart with item relationships

### SKU Generation Strategy
Auto-generated SKUs using category prefix + user ID segment + random component from a ulid:
```
Format: {CATEGORY_PREFIX}-{USER_SEGMENT}-{RANDOM}
Example: ELEC-0FEG-VHD8TK
```

### Business Rules Implemented

1. **Stock Validation**: Prevents adding more items than available stock
2. **Self-Purchase Prevention**: Users cannot add their own products to cart
3. **User Isolation**: Users can only modify their own products and cart

### Error Handling Strategy
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for development
- Sanitized errors for production

### Performance Considerations
- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient Prisma queries with selective field inclusion
- Connection pooling for database connections

## 💰 Currency Handling

The system handles Nigerian Naira (NGN) with dual pricing:
- **Unit Price**: Stored in kobo (smallest currency unit) for precision
- **Display Price**: Converted to naira for user-friendly display

Example:
```json
{
  "price": 999.99,
  "unitPrice": 99999,
  "itemTotalKobo": 199998,
  "itemTotalNaira": 1999.98
}
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Helmet security headers
- Environment variable protection

## 📂 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── dtos/           # Data Transfer Objects
├── middlewares/    # Custom middleware
├── routes/         # API route definitions
├── services/       # Business logic layer
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── validations/    # Joi validation schemas
```

## 🔄 Idempotency

The product creation endpoint supports idempotency to prevent duplicate requests and ensure data consistency.

### How It Works

1. **Idempotency Key**: Required `X-Idempotency-Key` header for product creation
2. **Duplicate Prevention**: Same key returns existing product, different key checks for duplicates
3. **User-Scoped**: Keys are unique per user
4. **Auto-Expiry**: Keys expire after 24 hours

### Usage Example

```bash
curl -X POST /api/v1/products \
  -H "X-Idempotency-Key: create-laptop-2024-01-15" \
  -H "Cookie: accessToken=your-token" \
  -d '{
    "name": "Gaming Laptop",
    "price": 1500.99,
    "stockLevel": 5,
    "categoryId": "cat_123"
  }'
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Generate coverage report
yarn test:coverage
```

### Test Database Configuration

- **Automatic Setup**: Tests automatically create and migrate a separate test database
- **Default Name**: `test_shopping_cart_db` (can be customized via `TEST_DATABASE_NAME` env var)
- **Clean State**: All test data is cleaned up between test runs

### Test Coverage

The test suite includes:
- **Unit Tests**: Service layer business logic
- **Integration Tests**: Full API endpoint testing
- **Authentication Tests**: Login, registration, refresh token and logout
- **Validation Tests**: Input sanitization and validation
- **Security Tests**: Rate limiting, SQL injection prevention
- **Edge Case Tests**: Error handling and boundary conditions

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV="production"
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="secure-production-secret"
PORT=3000
JWT_ACCESS_TOKEN_SECRET=
JWT_ACCESS_TOKEN_EXPIRE_IN_MINUTE=
JWT_REFRESH_TOKEN_SECRET=
JWT_REFRESH_TOKEN_EXPIRE_IN_DAYS=
CLIENT_URL=
SERVER_URL=
```

### Build and Deploy

```bash
yarn build
yarn start
```

## 🤔 Assumptions & Tradeoffs

### Assumptions Made

1. **Single Currency**: System assumes NGN as the primary currency
2. **Simple Categories**: One-level category hierarchy
3. **Single Cart**: One cart per user (no multiple carts)
4. **Stock Tracking**: Simple stock level tracking without reservations
5. **No Checkout**: Cart management only, no payment processing

### Tradeoffs

1. **SKU Generation**: Auto-generated vs manual entry
   - **Chosen**: Auto-generated for consistency
   - **Tradeoff**: Less flexibility but prevents duplicates

2. **Cart Persistence**: Session vs Database
   - **Chosen**: Database persistence
   - **Tradeoff**: More complex but survives sessions

3. **Stock Validation**: Real-time vs eventual consistency
   - **Chosen**: Real-time validation
   - **Tradeoff**: Better UX but potential race conditions

4. **Authentication**: JWT vs Sessions
   - **Chosen**: JWT for stateless API
   - **Tradeoff**: Token management complexity

## 🔮 Future Enhancements

- [ ] Inventory reservations during checkout
- [ ] Multiple currencies support
- [ ] Product variants (size, color, etc.)
- [ ] Categories hierarchy 
- [ ] Real-time stock updates via WebSockets
- [ ] Caching layer with Redis
- [ ] Extend idempotency to other endpoints, especially payment related endpoints when implemented


**Built with ❤️ for the Paystack Future Stack Program**