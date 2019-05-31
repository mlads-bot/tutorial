import * as request from 'request';

const ENDPOINT = 'https://directline.botframework.com/v3/directline';

export function generateToken(secret: string) {
  const authorization = `Bearer ${secret}`;
  return request.post(`${ENDPOINT}/tokens/generate`, { headers: { authorization } });
}
