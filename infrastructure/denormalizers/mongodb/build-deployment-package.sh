DIRNAME=$(dirname $0)
# mkdir $DIRNAME/node_modules
CWD=$(pwd)
cd $DIRNAME
npm install
cd $CWD
zip -r mongodb.zip $DIRNAME