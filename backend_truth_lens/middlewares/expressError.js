class ExpressError extends Error {
  constructor(statusCode = 500,message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ExpressError";
  }
}

module.exports = ExpressError;