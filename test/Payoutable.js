const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Payoutable = artifacts.require('PayoutableMock');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const PAYOUT_INSTRUCTION = 'payout_instruction';

contract('Payoutable', (accounts) => {
    let payoutable;
    let operationId;

    const owner = accounts[0];
    const from = accounts[1];
    const authorizedOperator = accounts[2];
    const unauthorizedOperator = accounts[3];
    const userC = accounts[4];

    beforeEach(async() => {
        payoutable = await Payoutable.new({from: owner});
        await payoutable.mint(from, 3);

        operationId = randomString.generate();
    });

    describe('orderPayout', async() => {
        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayout(
                    '',
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: from}
                ),
                'Operation ID must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayout(
                    operationId,
                    0,
                    PAYOUT_INSTRUCTION,
                    {from: from}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await payoutable.orderPayout(
                operationId,
                1,
                PAYOUT_INSTRUCTION,
                {from: from}
            );

            await truffleAssert.reverts(
                payoutable.orderPayout(
                    operationId,
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: from}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if value id greater than balance', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayout(
                    operationId,
                    4,
                    PAYOUT_INSTRUCTION,
                    {from: from}
                )
            );
        });

        it('should successfully create a hold and emit a HoldCreated event', async() => {
            const tx = await payoutable.orderPayout(
                operationId,
                1,
                PAYOUT_INSTRUCTION,
                {from: from}
            );

            truffleAssert.eventEmitted(tx, 'PayoutOrdered', (_event) => {
                return _event.orderer === from &&
                    _event.operationId === operationId &&
                    _event.walletToDebit === from &&
                    _event.value.toNumber() === 1 &&
                    _event.instructions === PAYOUT_INSTRUCTION
                    ;
            });
        });
    });

    describe('orderPayoutFrom', async() => {
        beforeEach(async() => {
            await payoutable.authorizePayoutOperator(
                authorizedOperator,
                {from: from}
            );
        });

        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    '',
                    from,
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: authorizedOperator}
                ),
                'Operation ID must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    from,
                    0,
                    PAYOUT_INSTRUCTION,
                    {from: authorizedOperator}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    from,
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: authorizedOperator}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if from address is zero', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    ZERO_ADDRESS,
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: authorizedOperator}
                ),
                'walletToBePaidOut address must not be zero address'
            );
        });

        it('should revert if value id greater than balance', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    from,
                    4,
                    PAYOUT_INSTRUCTION,
                    {from: authorizedOperator}
                )
            );
        });

        it('should revert if operator is not authorized', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    from,
                    1,
                    PAYOUT_INSTRUCTION,
                    {from: unauthorizedOperator}
                )
            );
        });

        it('should successfully create a hold and emit a HoldCreated event', async() => {
            const tx = await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );

            truffleAssert.eventEmitted(tx, 'PayoutOrdered', (_event) => {
                return _event.orderer === authorizedOperator &&
                    _event.operationId === operationId &&
                    _event.walletToDebit === from &&
                    _event.value.toNumber() === 1 &&
                    _event.instructions === PAYOUT_INSTRUCTION
                ;
            });
        });
    });

    describe('authorizePayoutOperator', async() => {
        it('should authorize an operator and emit a AuthorizedPayoutOperator event', async() => {
            const tx = await payoutable.authorizePayoutOperator(authorizedOperator, {from: from});

            const isAuthorized = await payoutable.isPayoutOperatorFor(authorizedOperator, from);
            assert.strictEqual(isAuthorized, true, 'Operator has not been authorized');

            truffleAssert.eventEmitted(tx, 'AuthorizedPayoutOperator', (_event) => {
                return _event.operator === authorizedOperator && _event.account === from;
            });
        });

        it('should revert if an operator has already been authorized', async() => {
            await payoutable.authorizePayoutOperator(authorizedOperator, {from: from});

            await truffleAssert.reverts(
                payoutable.authorizePayoutOperator(authorizedOperator, {from: from}),
                'The operator is already authorized'
            );
        });
    });

    describe('revokePayoutOperator', async() => {
        it('should revert if an operator has not been authorized', async() => {
            await truffleAssert.reverts(
                payoutable.revokePayoutOperator(unauthorizedOperator, {from: from}),
                'The operator is already not authorized'
            );
        });

        it('should revoke the authorization of an operator and emit a RevokedPayoutOperator event', async() => {
            await payoutable.authorizePayoutOperator(unauthorizedOperator, {from: from});

            const tx = await payoutable.revokePayoutOperator(unauthorizedOperator, {from: from});

            const isAuthorized = await payoutable.isPayoutOperatorFor(authorizedOperator, from);
            assert.strictEqual(isAuthorized, false, 'Operator authorization has not been revoked');

            truffleAssert.eventEmitted(tx, 'RevokedPayoutOperator', (_event) => {
                return _event.operator === unauthorizedOperator && _event.account === from;
            });
        });
    });
});
