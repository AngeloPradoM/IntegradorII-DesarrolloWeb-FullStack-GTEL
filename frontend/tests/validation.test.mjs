import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApplication, validateCv, validateJob } from '../src/utils/formValidation.js';
import { candidateKey, ownApplications, hasApplied, applicationFormData } from '../src/utils/applications.js';

const personal = { nombres:'Juan Carlos', apellidos:'De la Cruz', dni:'12345678', email:'candidate@example.test', telefono:'987654321', distrito:'Lima' };
const cv = { name:'cv.pdf', type:'application/pdf', size:100, lastModified:1 };
test('Application step validation and terms', () => {
  assert.ok(validateApplication({}, null, false, 1).nombres);
  assert.deepEqual(validateApplication(personal, null, false, 1), {});
  assert.ok(validateApplication(personal, null, false, 2).cv);
  assert.ok(validateApplication(personal, cv, false).terms);
  assert.deepEqual(validateApplication(personal, cv, true), {});
  assert.ok(validateApplication({...personal,email:'invalid'}, cv, true).email);
  assert.ok(validateApplication({...personal,telefono:'123'}, cv, true).telefono);
});
test('Invalid, empty and oversized CVs are rejected', () => {
  assert.ok(validateCv({...cv,name:'cv.exe'}));
  assert.ok(validateCv({...cv,size:0}));
  assert.ok(validateCv({...cv,size:6*1024*1024}));
  assert.equal(validateCv(cv), '');
});
test('Candidate isolation and legacy records', () => {
  const a = {id:'a',token:'test',rol:'CANDIDATO'};
  const b = {id:'b',token:'test',rol:'CANDIDATO'};
  const items = [{candidateId:candidateKey(a),jobId:1}, {id:1,jobId:1}];
  assert.equal(ownApplications(items,a).length,1);
  assert.equal(ownApplications(items,b).length,0);
  assert.equal(hasApplied(items,a,1),true);
  assert.equal(hasApplied(items,b,1),false);
  assert.equal(candidateKey({token:'demo-session:CANDIDATO:a',rol:'CANDIDATO'}),candidateKey(a));
  assert.throws(()=>candidateKey(null));
});
test('Job title, salary boundaries, vacancies and whitespace', () => {
  const job={title:'Oferta',type:'Full-Time',location:'Lima',description:'Descripción',department:'Ventas',salaryMin:0,salaryMax:3000,vacancies:1};
  assert.deepEqual(validateJob(job),{});
  for(const title of ['', '   ']) assert.ok(validateJob({...job,title}).title);
  for(const salaryMin of [-100,'',Infinity,'abc',5000]) assert.ok(Object.keys(validateJob({...job,salaryMin})).length);
  assert.ok(validateJob({...job,vacancies:0}).vacancies);
});
test('Future multipart payload retains the file without serializing it', () => {
  const file = new File(['cv'], 'cv.pdf', {type:'application/pdf'});
  const payload = applicationFormData({jobId:1,cv},file);
  assert.equal(payload.get('cv').name,'cv.pdf');
  assert.equal(JSON.parse(payload.get('application')).jobId,1);
});
