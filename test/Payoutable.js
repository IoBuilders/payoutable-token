const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Payoutable = artifacts.require('PayoutableMock');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Payoutable', (accounts) => {
    let payoutable;
    let operationId;

    const owner = accounts[0];
    const payer = accounts[1];
    const payee = accounts[2];
    const authorizedOperator = accounts[3];
    const unauthorizedOperator = accounts[4];
    const notary = accounts[5];
    const userC = accounts[6];

    beforeEach(async() => {
        payoutable = await Payoutable.new({from: owner});
        await payoutable.mint(payer, 3);

        operationId = randomString.generate();
    });

    describe('authorizePayoutOperator', async() => {
        it('should authorize an operator and emit a AuthorizedPayoutOperator event', async() => {
            const tx = await payoutable.authorizePayoutOperator(authorizedOperator, {from: payer});

            const isAuthorized = await payoutable.isPayoutOperatorFor(authorizedOperator, payer);
            assert.strictEqual(isAuthorized, true, 'Operator has not been authorized');

            truffleAssert.eventEmitted(tx, 'AuthorizedPayoutOperator', (_event) => {
                return _event.operator === authorizedOperator && _event.account === payer;
            });
        });

        it('should revert if an operator has already been authorized', async() => {
            await payoutable.authorizePayoutOperator(authorizedOperator, {from: payer});

            await truffleAssert.reverts(
                payoutable.authorizePayoutOperator(authorizedOperator, {from: payer}),
                'The operator is already authorized'
            );
        });
    });

    describe('revokePayoutOperator', async() => {
        it('should revert if an operator has not been authorized', async() => {
            await truffleAssert.reverts(
                payoutable.revokePayoutOperator(unauthorizedOperator, {from: payer}),
                'The operator is already not authorized'
            );
        });

        it('should revoke the authorization of an operator and emit a RevokedPayoutOperator event', async() => {
            await payoutable.authorizePayoutOperator(unauthorizedOperator, {from: payer});

            const tx = await payoutable.revokePayoutOperator(unauthorizedOperator, {from: payer});

            const isAuthorized = await payoutable.isPayoutOperatorFor(authorizedOperator, payer);
            assert.strictEqual(isAuthorized, false, 'Operator authorization has not been revoked');

            truffleAssert.eventEmitted(tx, 'RevokedPayoutOperator', (_event) => {
                return _event.operator === unauthorizedOperator && _event.account === payer;
            });
        });
    });
});
