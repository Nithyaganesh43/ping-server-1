
const ping_pong = require('express').Router();
 
 let pingCycle=false;
ping_pong.get('/ping', async (req, res) => {
  if(!pingCycle){
  pingCycle = true;
  if (pingCycle) {
    console.log('Pong Pong Server 1');
    setTimeout(() => {
      callback();
    }, 300000);
  } 
  }
  res.send('Pong from Server 1');
 
});

(async () => {
  pingCycle=false;
  await fetch('https://ping-server-2-3ebj.onrender.com/ping')
    .then((res) => {
      if (res.ok) {
        console.log('Server 2 is responding:', res.status);
      } else {
        console.log('Server 2 responded with an error:', res.status);
      }
    })
    .catch((err) => {
      console.error('Server 2 is not responding:', err.message);
    });
})();

function callback() { 
  pingCycle=false;
  fetch('https://ping-server-2-3ebj.onrender.com/ping')
    .then((res) => {
      if (res.ok) {
        console.log('Server 2 is responding:', res.status);
      } else {
        console.log('Server 2 responded with an error:', res.status);
      }
    })
    .catch((err) => {
      console.error('Server 2 is not responding:', err.message);
    });
}



module.exports=ping_pong;