export const areAnswersEquivalent = (studentAns = '', expectedAns = '') => {
  const normalize = (str) => 
    str.toLowerCase()
       .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
       .replace(/\s+/g, ' ')
       .trim();
       
  const normStudent = normalize(studentAns);
  const options = expectedAns.split('|').map(normalize);
  
  return options.includes(normStudent);
};
