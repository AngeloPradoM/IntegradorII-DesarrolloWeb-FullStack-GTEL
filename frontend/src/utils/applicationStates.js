const aliases={new:'recibida',reviewing:'en_revision',interview:'entrevista',approved:'aprobada',rejected:'rechazada'};
const transitions={recibida:['en_revision','entrevista','rechazada'],en_revision:['entrevista','aprobada','rechazada'],entrevista:['en_revision','aprobada','rechazada'],aprobada:[],rechazada:[]};
export const canonicalStatus=status=>aliases[status]||status;
export const nextApplicationStates=status=>transitions[canonicalStatus(status)]||[];
export const canTransition=(status,next)=>nextApplicationStates(status).includes(next);
