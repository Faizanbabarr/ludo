const fs = require('fs')
const msg = fs.readFileSync(0, 'utf8')
const out = msg.split('\n').filter(l => !l.includes('Co-authored-by')).join('\n').trimEnd()
process.stdout.write(out + '\n')
