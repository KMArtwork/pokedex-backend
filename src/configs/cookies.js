'use strict';

const accessCookieConfig = {    
  sameSite: 'none',
  secure: true,
  httpOnly: true,
  maxAge: 1 * 60 * 60 * 1000
};
const refreshCookieConfig = {
  sameSite: 'none',
  secure: true,
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000
};

module.exports = {
  accessCookieConfig,
  refreshCookieConfig
}