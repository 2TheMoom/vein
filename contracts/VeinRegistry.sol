// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VeinRegistry
 * @notice On-chain query credit registry for Vein — LiteForge Ecosystem Intelligence
 * @dev Deployed on LiteForge (Chain ID 4441)
 * @author Abu Olumi (x.com/Olumi441)
 */
contract VeinRegistry {

    // ── State ────────────────────────────────────────────────────
    address public owner;
    address public paymentDestination;
    uint256 public queryPrice;
    uint256 public freeQueryLimit;

    mapping(address => uint256) public queryCredits;
    mapping(address => uint256) public totalQueriesUsed;
    mapping(address => uint256) public freeQueriesUsed;

    // ── Events ───────────────────────────────────────────────────
    event CreditsPurchased(address indexed wallet, uint256 credits, uint256 paid);
    event QueryConsumed(address indexed wallet, uint256 creditsRemaining, bool wasFree);
    event PaymentDestinationUpdated(address indexed newDestination);
    event QueryPriceUpdated(uint256 newPrice);
    event FreeQueryLimitUpdated(uint256 newLimit);
    event OwnershipTransferred(address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "VeinRegistry: caller is not owner");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────
    constructor(address _paymentDestination) {
        require(_paymentDestination != address(0), "VeinRegistry: zero address");
        owner               = msg.sender;
        paymentDestination  = _paymentDestination;
        queryPrice          = 5000000000000000;
        freeQueryLimit      = 5;
    }

    // ── Purchase credits ─────────────────────────────────────────
    function purchaseCredits() external payable {
        require(msg.value >= queryPrice, "VeinRegistry: insufficient payment");

        uint256 credits = msg.value / queryPrice;
        uint256 cost    = credits * queryPrice;
        uint256 refund  = msg.value - cost;

        queryCredits[msg.sender] += credits;

        payable(paymentDestination).transfer(cost);

        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }

        emit CreditsPurchased(msg.sender, credits, cost);
    }

    // ── Consume a query ──────────────────────────────────────────
    function consumeQuery(address wallet) external onlyOwner {
        require(wallet != address(0), "VeinRegistry: zero address");

        bool wasFree = false;

        if (freeQueriesUsed[wallet] < freeQueryLimit) {
            freeQueriesUsed[wallet]++;
            wasFree = true;
        } else {
            require(queryCredits[wallet] > 0, "VeinRegistry: no credits");
            queryCredits[wallet]--;
        }

        totalQueriesUsed[wallet]++;
        emit QueryConsumed(wallet, queryCredits[wallet], wasFree);
    }

    // ── Views ────────────────────────────────────────────────────
    function canQuery(address wallet) external view returns (bool) {
        return freeQueriesUsed[wallet] < freeQueryLimit || queryCredits[wallet] > 0;
    }

    function walletStatus(address wallet) external view returns (
        uint256 credits,
        uint256 freeUsed,
        uint256 freeRemaining,
        uint256 totalUsed,
        bool eligible
    ) {
        credits       = queryCredits[wallet];
        freeUsed      = freeQueriesUsed[wallet];
        freeRemaining = freeQueryLimit > freeUsed ? freeQueryLimit - freeUsed : 0;
        totalUsed     = totalQueriesUsed[wallet];
        eligible      = freeUsed < freeQueryLimit || credits > 0;
    }

    // ── Admin ────────────────────────────────────────────────────
    function setPaymentDestination(address _dest) external onlyOwner {
        require(_dest != address(0), "VeinRegistry: zero address");
        paymentDestination = _dest;
        emit PaymentDestinationUpdated(_dest);
    }

    function setQueryPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "VeinRegistry: zero price");
        queryPrice = _price;
        emit QueryPriceUpdated(_price);
    }

    function setFreeQueryLimit(uint256 _limit) external onlyOwner {
        freeQueryLimit = _limit;
        emit FreeQueryLimitUpdated(_limit);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "VeinRegistry: zero address");
        owner = _newOwner;
        emit OwnershipTransferred(_newOwner);
    }

    function grantCredits(address wallet, uint256 amount) external onlyOwner {
        require(wallet != address(0), "VeinRegistry: zero address");
        queryCredits[wallet] += amount;
        emit CreditsPurchased(wallet, amount, 0);
    }

    // ── Emergency ────────────────────────────────────────────────
    receive() external payable {}

    function withdrawStuck() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}