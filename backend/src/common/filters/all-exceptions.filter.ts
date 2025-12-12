import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Validation hatalarını daha detaylı göster
    let message: string | string[] = 'Internal server error';
    if (exception instanceof BadRequestException) {
      const response = exceptionResponse as any;
      if (Array.isArray(response.message)) {
        message = response.message;
      } else if (typeof response.message === 'string') {
        message = response.message;
      } else if (response.message) {
        message = response.message;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || 'Internal server error';
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Exception:', exception);
    }

    response.status(status).json(errorResponse);
  }
}

