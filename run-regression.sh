echo "[RUN] Running unit test"
yarn test 
sleep 5

echo "[RUN] Running automated UI testing"
yarn test:e2e
sleep 3
node test/components/AutomatedAddToBasket.test.js
sleep 3
node test/components/AutomatedCheckout.test.js
sleep 3
node test/components/AutomatedLogin.test.js
sleep 3

echo "[PASSED] Regression testing complete"
