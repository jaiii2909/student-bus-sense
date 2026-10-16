// Send a friendly error to the client and keep the details in the server log.
const sendError = (res, err) => {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ error: `That ${field} already exists` });
  }
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }
  if (err && err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong, please try again' });
};

module.exports = { sendError };
