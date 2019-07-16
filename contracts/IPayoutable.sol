pragma solidity ^0.5.0;

interface IPayoutable {
    enum PayoutStatusCode {
        Nonexistent,
        Ordered,
        InProcess,
        FundsInSuspense,
        Executed,
        Rejected,
        Cancelled
    }

    function orderPayout(string calldata operationId, uint256 value, string calldata instructions) external returns (bool);
    function orderPayoutFrom(
        string calldata operationId,
        address walletToBePaidOut,
        uint256 value,
        string calldata instructions
    ) external returns (bool);
    function cancelPayout(string calldata operationId) external returns (bool);
    function processPayout(string calldata operationId) external returns (bool);
    function putFundsInSuspenseInPayout(string calldata operationId) external returns (bool);
    function executePayout(string calldata operationId) external returns (bool);
    function rejectPayout(string calldata operationId, string calldata reason) external returns (bool);
    function retrievePayoutData(string calldata operationId) external view returns (
        address walletToDebit,
        uint256 value,
        string memory instructions,
        PayoutStatusCode status
    );

    function authorizePayoutOperator(address operator) external returns (bool);
    function revokePayoutOperator(address operator) external returns (bool);
    function isPayoutOperatorFor(address operator, address from) external view returns (bool);

    event PayoutOrdered(address indexed orderer, string operationId, address indexed walletToDebit, uint256 value, string instructions);
    event PayoutInProcess(address indexed orderer, string operationId);
    event PayoutFundsInSuspense(address indexed orderer, string operationId);
    event PayoutExecuted(address indexed orderer, string operationId);
    event PayoutRejected(address indexed orderer, string operationId, string reason);
    event PayoutCancelled(address indexed orderer, string operationId);
    event AuthorizedPayoutOperator(address indexed operator, address indexed account);
    event RevokedPayoutOperator(address indexed operator, address indexed account);
}
