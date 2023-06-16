'use strict';

function handle500(err, req, res, next){
  console.log('HANDLE 500 MIDDLEWARE HIT', err)
  const error = err.message ? err.message: err;

  const errorObject = {
    status: 500,
    message: error
  };

  res.status(500).json(errorObject)
}

module.exports = handle500;