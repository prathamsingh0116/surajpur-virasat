function notFound(req, res, next) {
  const err = new Error("The page you requested could not be found.");
  err.status = 404;
  next(err);
}
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  console.error(err);
  res.status(status).render("error", {
    title: status === 404 ? "Page not found" : "Something went wrong",
    message: process.env.NODE_ENV === "production" && status === 500
      ? "Please try again later."
      : err.message,
    layout: "layouts/boilerplate"
  });
}
module.exports = { notFound, errorHandler };
