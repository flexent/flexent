export class BaseError extends Error {

    override name = this.constructor.name;

    status = 500;

    get defaultMessage() {
        return 'An unknown error has occurred';
    }

    constructor(message?: string) {
        super();
        this.message = message || this.defaultMessage;
    }

}

export class ClientError extends BaseError {

    override status = 400;

    override get defaultMessage() {
        return 'Client error';
    }

}

export class NotFoundError extends BaseError {

    override status = 404;

    override get defaultMessage() {
        return 'Resource not found';
    }

}

export class ConflictError extends BaseError {

    override status = 409;

    override get defaultMessage() {
        return 'The requested operation results in a conflict';
    }

}

export class UniqueConstraintViolationError extends BaseError {

    override status = 409;

    override get defaultMessage() {
        return 'The requested operation results in an unique constraint violation';
    }

}

export class RequestSizeExceededError extends BaseError {

    override status = 413;

    override get defaultMessage() {
        return 'The request payload exceeds the limit';
    }

}

export class AuthenticationRequiredError extends BaseError {

    override status = 401;

    override get defaultMessage() {
        return 'Authentication is required';
    }

}

export class InvalidAuthenticationError extends BaseError {

    override status = 401;

    override get defaultMessage() {
        return 'Invalid authentication';
    }

}

export class AccessDeniedError extends BaseError {

    override status = 403;

    override get defaultMessage() {
        return 'Access denied';
    }

}

export class RateLimitExceededError extends BaseError {

    override status = 429;

    override get defaultMessage() {
        return 'Rate Limit Exceeded';
    }

}

export class ServerError extends BaseError {

    override status = 500;

    override get defaultMessage() {
        return 'The request cannot be processed';
    }

}

export class InvalidStateError extends BaseError {

    override status = 500;

    override get defaultMessage() {
        return 'Invalid state';
    }

}

export class InitializationError extends BaseError {

    override status = 500;

    override get defaultMessage() {
        return 'Initialization error';
    }

}

export class NotImplementedError extends BaseError {

    override status = 500;

    override get defaultMessage() {
        return 'Not implemented';
    }

}
