const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Payoutable = artifacts.require('PayoutableMock');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const PAYOUT_INSTRUCTION = '{\n' +
    '    "messageId": "Example Message ID",\n' +
    '    "payouts": [\n' +
    '        {\n' +
    '            "amount": 1.00,\n' +
    '            "bankAccountId": "caaa2bd3-dc42-436a-b70b-d1d7dac23741",\n' +
    '            "remittanceInformation": "Example Remittance Information"\n' +
    '        }\n' +
    '    ]\n' +
    '}';

const STATUS_ORDERED = 1;
const STATUS_FUNDS_IN_SUSPENSE = 3;
const STATUS_EXECUTED = 4;
const STATUS_REJECTED = 5;
const STATUS_CANCELLED = 6;

contract('Payoutable', (accounts) => {
    let payoutable;
    let operationId;

    const payoutAgent = accounts[0];
    const from = accounts[1];
    const authorizedOperator = accounts[2];
    const unauthorizedOperator = accounts[3];
    const suspenseAccount = accounts[4];

    beforeEach(async() => {
        payoutable = await Payoutable.new(suspenseAccount, {from: payoutAgent});
        await payoutable.mint(from, 3);

        operationId = randomString.generate();
    });

    describe('constructor', async() => {
        it('should revert if suspense account is zero address', async() => {
            await truffleAssert.reverts(
                Payoutable.new(
                    ZERO_ADDRESS,
                    {from: payoutAgent}
                ),
                'Suspense account must not be the zero address'
            );
        });

        it('should set the suspense account and the payout agent', async() => {
            const suspenseAccountFromContract = await payoutable.suspenseAccount();
            assert.strictEqual(suspenseAccountFromContract, suspenseAccount, 'Suspense account not set correctly');

            const payoutAgentFromContract = await payoutable.payoutAgent();
            assert.strictEqual(payoutAgentFromContract, payoutAgent, 'Payout agent not set correctly');
        });
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

        it('should revert if value is greater than balance', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayout(
                    operationId,
                    4,
                    PAYOUT_INSTRUCTION,
                    {from: from}
                ),
                'Amount of the hold can\'t be greater than the balance of the origin'
            );
        });

        it('should revert if the payout instruction is empty', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayout(
                    operationId,
                    1,
                    '',
                    {from: from}
                ),
                'Instructions must not be empty'
            );
        });

        it('should successfully order a payout and emit a PayoutOrdered event', async() => {
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

            const orderedPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(orderedPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(orderedPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(orderedPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(orderedPayout.status.toNumber(), STATUS_ORDERED, 'status not set to ordered');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 2, 'Balance of payer not updated after ordering of payout');
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
                ),
                'Amount of the hold can\'t be greater than the balance of the origin'
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
                ),
                'This operator is not authorized'
            );
        });

        it('should revert if the payout instruction is empty', async() => {
            await truffleAssert.reverts(
                payoutable.orderPayoutFrom(
                    operationId,
                    from,
                    1,
                    '',
                    {from: authorizedOperator}
                ),
                'Instructions must not be empty'
            );
        });

        it('should successfully order a payout and emit a PayoutOrdered event', async() => {
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

            const orderedPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(orderedPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(orderedPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(orderedPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(orderedPayout.status.toNumber(), STATUS_ORDERED, 'status not set to ordered');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 2, 'Balance of payer not updated after ordering of payout');
        });
    });

    describe('cancelPayout', async() => {
        beforeEach(async() => {
            await payoutable.authorizePayoutOperator(
                authorizedOperator,
                {from: from}
            );

            await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                payoutable.cancelPayout(
                    randomString.generate(),
                    {from: from}
                ),
                'A payout can only be cancelled in status Ordered'
            );
        });

        it('should revert if the contract payout agent calls it', async() => {
            await truffleAssert.reverts(
                payoutable.cancelPayout(
                    operationId,
                    {from: payoutAgent}
                ),
                'A payout can only be cancelled by the orderer or the walletToBePaidOut'
            );
        });

        it('should cancel the payout and emit a PayoutCancelled event if called by walletToBePaidOut', async() => {
            const tx = await payoutable.cancelPayout(
                operationId,
                {from: from}
            );

            truffleAssert.eventEmitted(tx, 'PayoutCancelled', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const cancelledPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(cancelledPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(cancelledPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledPayout.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 3, 'Balance of payer not updated after cancellation');

        });

        it('should cancel the payout and emit a PayoutCancelled event if called by the issuer', async() => {
            const tx = await payoutable.cancelPayout(
                operationId,
                {from: authorizedOperator}
            );

            truffleAssert.eventEmitted(tx, 'PayoutCancelled', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const cancelledPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(cancelledPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(cancelledPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledPayout.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 3, 'Balance of payer not updated after cancellation');
        });

        it('should revert if the contract payout is in status in progress', async() => {
            await payoutable.cancelPayout(
                operationId,
                {from: from}
            );

            await truffleAssert.reverts(
                payoutable.cancelPayout(
                    operationId,
                    {from: from}
                ),
                'A payout can only be cancelled in status Ordered'
            );
        });
    });

    describe('processPayout', async() => {
        it('should always revert', async() => {
            await payoutable.orderPayout(
                operationId,
                1,
                PAYOUT_INSTRUCTION,
                {from: from}
            );

            await truffleAssert.reverts(
                payoutable.processPayout(
                    operationId,
                    {from: payoutAgent}
                ),
                'Function not supported in this implementation'
            );
        });
    });

    describe('putFundsInSuspenseInPayout', async() => {
        it('should always revert', async() => {
            await payoutable.orderPayout(
                operationId,
                1,
                PAYOUT_INSTRUCTION,
                {from: from}
            );

            await truffleAssert.reverts(
                payoutable.putFundsInSuspenseInPayout(
                    operationId,
                    {from: payoutAgent}
                ),
                'Function not supported in this implementation'
            );
        });
    });

    describe('processPayoutToSuspenseAccount', async() => {
        beforeEach(async() => {
            await payoutable.authorizePayoutOperator(
                authorizedOperator,
                {from: from}
            );

            await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                payoutable.transferPayoutToSuspenseAccount(
                    randomString.generate(),
                    {from: payoutAgent}
                ),
                'A payout can only be set to FundsInSuspense from status Ordered'
            );
        });

        it('should revert if a payout is cancelled', async() => {
            await payoutable.cancelPayout(
                operationId,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                payoutable.transferPayoutToSuspenseAccount(
                    operationId,
                    {from: payoutAgent}
                ),
                'A payout can only be set to FundsInSuspense from status Ordered'
            );
        });

        it('should revert if called by the orderer', async() => {
            await truffleAssert.reverts(
                payoutable.transferPayoutToSuspenseAccount(
                    operationId,
                    {from: authorizedOperator}
                ),
                'A payout can only be set to in suspense by the payout agent'
            );
        });

        it('should revert if called by walletToBePaidOut', async() => {
            await truffleAssert.reverts(
                payoutable.transferPayoutToSuspenseAccount(
                    operationId,
                    {from: from}
                ),
                'A payout can only be set to in suspense by the payout agent'
            );
        });

        it('should set the payout to status FundsInSuspense and emit a PayoutFundsInSuspense event if called by the payout agent', async() => {
            const tx = await payoutable.transferPayoutToSuspenseAccount(
                operationId,
                {from: payoutAgent}
            );

            truffleAssert.eventEmitted(tx, 'PayoutFundsInSuspense', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const inProcessPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(inProcessPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(inProcessPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(inProcessPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(inProcessPayout.status.toNumber(), STATUS_FUNDS_IN_SUSPENSE, 'status not set to in suspense');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 2, 'Balance of walletToBePaidOut not updated after transfer to suspense account');

            const balanceOfSuspenseAccount = await payoutable.balanceOf(suspenseAccount);
            assert.strictEqual(balanceOfSuspenseAccount.toNumber(), 1, 'Balance of suspense account not updated');
        });
    });

    describe('executePayout', async() => {
        beforeEach(async () => {
            await payoutable.authorizePayoutOperator(
                authorizedOperator,
                {from: from}
            );

            await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                payoutable.executePayout(
                    randomString.generate(),
                    {from: payoutAgent}
                ),
                'A payout can only be executed from status FundsInSuspense'
            );
        });

        it('should revert if a payout is cancelled', async() => {
            await payoutable.cancelPayout(
                operationId,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                payoutable.executePayout(
                    operationId,
                    {from: payoutAgent}
                ),
                'A payout can only be executed from status FundsInSuspense'
            );
        });

        it('should revert if called by the orderer', async() => {
            await payoutable.transferPayoutToSuspenseAccount(
                operationId,
                {from: payoutAgent}
            );

            await truffleAssert.reverts(
                payoutable.executePayout(
                    operationId,
                    {from: authorizedOperator}
                ),
                'A payout can only be executed by the payout agent'
            );
        });

        it('should revert if called by walletToBePaidOut', async() => {
            await payoutable.transferPayoutToSuspenseAccount(
                operationId,
                {from: payoutAgent}
            );

            await truffleAssert.reverts(
                payoutable.executePayout(
                    operationId,
                    {from: from}
                ),
                'A payout can only be executed by the payout agent'
            );
        });

        it('should set the burn the tokens from the suspense account and emit a PayoutExecuted event if called by the payout agent', async() => {
            await payoutable.transferPayoutToSuspenseAccount(
                operationId,
                {from: payoutAgent}
            );

            const tx = await payoutable.executePayout(
                operationId,
                {from: payoutAgent}
            );

            truffleAssert.eventEmitted(tx, 'PayoutExecuted', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const executedPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(executedPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(executedPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(executedPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(executedPayout.status.toNumber(), STATUS_EXECUTED, 'status not set to executed');

            const balanceOfSuspenseAccount = await payoutable.balanceOf(suspenseAccount);
            assert.strictEqual(balanceOfSuspenseAccount.toNumber(), 0, 'Balance of suspense account not updated');
        });
    });

    describe('rejectPayout', async() => {
        let reason;

        beforeEach(async () => {
            await payoutable.authorizePayoutOperator(
                authorizedOperator,
                {from: from}
            );

            await payoutable.orderPayoutFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );

            reason = randomString.generate();
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                payoutable.rejectPayout(
                    randomString.generate(),
                    reason,
                    {from: payoutAgent}
                ),
                'A payout can only be rejected from status Ordered'
            );
        });

        it('should revert if a payout is cancelled', async() => {
            await payoutable.cancelPayout(
                operationId,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                payoutable.rejectPayout(
                    operationId,
                    reason,
                    {from: payoutAgent}
                ),
                'A payout can only be rejected from status Ordered'
            );
        });

        it('should revert if a payout is in status FundsInSuspense', async() => {
            await payoutable.transferPayoutToSuspenseAccount(
                operationId,
                {from: payoutAgent}
            );

            await truffleAssert.reverts(
                payoutable.rejectPayout(
                    operationId,
                    reason,
                    {from: payoutAgent}
                ),
                'A payout can only be rejected from status Ordered'
            );
        });

        it('should revert if called by the orderer', async() => {
            await truffleAssert.reverts(
                payoutable.rejectPayout(
                    operationId,
                    reason,
                    {from: authorizedOperator}
                ),
                'A payout can only be rejected by the payout agent'
            );
        });

        it('should revert if called by walletToBePaidOut', async() => {
            await truffleAssert.reverts(
                payoutable.rejectPayout(
                    operationId,
                    reason,
                    {from: from}
                ),
                'A payout can only be rejected by the payout agent'
            );
        });

        it('should set the payout to status Rejected and emit a PayoutRejected event if called by the payout agent', async() => {
            const tx = await payoutable.rejectPayout(
                operationId,
                reason,
                {from: payoutAgent}
            );

            truffleAssert.eventEmitted(tx, 'PayoutRejected', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId && _event.reason === reason;
            });

            const inProcessPayout = await payoutable.retrievePayoutData(operationId);

            assert.strictEqual(inProcessPayout.walletToDebit, from, 'walletToDebit not set correctly');
            assert.strictEqual(inProcessPayout.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(inProcessPayout.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(inProcessPayout.status.toNumber(), STATUS_REJECTED, 'status not set to rejected');

            const balanceOfFrom = await payoutable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 3, 'Balance of walletToBePaidOut not updated after rejected payout');
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
