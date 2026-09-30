import test from 'node:test';
import assert from 'node:assert/strict';
import {token,digest,otp,signCode,matches,sessionToken,normalizeEmail,validEmail} from './security.js';
test('Codes are bound to their challenge and secret',()=>{
  const secret=token(), challenge=token(), code=otp();
  assert.match(code,/^\d{6}$/);
  const hash=signCode(secret,challenge,code);
  assert.equal(matches(hash,signCode(secret,challenge,code)),true);
  assert.equal(matches(hash,signCode(secret,token(),code)),false);
  assert.equal(matches(hash,signCode(token(),challenge,code)),false);
});
test('Session cookie is validated and only its digest is stored',()=>{
  const session=token();
  assert.equal(sessionToken({headers:{cookie:`other=1; gtel_session=${session}`}}),session);
  assert.equal(sessionToken({headers:{cookie:'gtel_session=forged'}}),null);
  assert.equal(sessionToken({headers:{}}),null);
  assert.equal(digest(session).length,32);
  assert.notEqual(digest(session).toString('hex'),session);
});
test('Email normalization and limits',()=>{
  assert.equal(normalizeEmail(' TEST@EXAMPLE.COM '),'test@example.com');
  assert.equal(validEmail('test@example.com'),true);
  assert.equal(validEmail('bad\n@example.com'),false);
  assert.equal(validEmail('x'.repeat(255)+'@example.com'),false);
});
