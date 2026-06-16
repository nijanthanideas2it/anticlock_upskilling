import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ServiceDesk CRM API',
      version: '1.0.0',
      description:
        'REST API for the ServiceDesk CRM — manages customers, tickets, agents, SLAs, escalations, and reporting.',
      contact: { name: 'ServiceDesk Team' },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Current version',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT access token stored in httpOnly cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'email: Invalid email address' },
              },
              required: ['code', 'message'],
            },
          },
          required: ['error'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 142 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 8 },
          },
        },
        UserDTO: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Bob Agent' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT', 'CUSTOMER'] },
            isActive: { type: 'boolean' },
            isAvailable: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TicketDTO: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            referenceNumber: { type: 'string', example: 'SD-00001' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
            },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            slaStatus: {
              type: 'string',
              enum: ['WARNING', 'BREACHED'],
              nullable: true,
            },
            slaResponseDue: { type: 'string', format: 'date-time', nullable: true },
            slaResolutionDue: { type: 'string', format: 'date-time', nullable: true },
            firstResponseAt: { type: 'string', format: 'date-time', nullable: true },
            resolvedAt: { type: 'string', format: 'date-time', nullable: true },
            csatScore: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CommentDTO: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            visibility: { type: 'string', enum: ['PUBLIC', 'INTERNAL'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SlaPolicyDTO: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            maxResponseMinutes: { type: 'integer' },
            maxResolutionMinutes: { type: 'integer' },
            businessHoursOnly: { type: 'boolean' },
            warningThreshold: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        NotificationDTO: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['EMAIL', 'IN_APP'] },
            eventType: { type: 'string' },
            payload: { type: 'object' },
            isRead: { type: 'boolean' },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        ValidationError: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Tickets', description: 'Ticket lifecycle management' },
      { name: 'Comments', description: 'Ticket comments & internal notes' },
      { name: 'Attachments', description: 'File attachment upload via S3' },
      { name: 'Users', description: 'User account management' },
      { name: 'Customers', description: 'Customer profile management' },
      { name: 'Categories', description: 'Ticket category configuration' },
      { name: 'SLA Policies', description: 'SLA policy configuration' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Reports', description: 'Reporting dashboard data' },
      { name: 'Config', description: 'System configuration (business hours)' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
