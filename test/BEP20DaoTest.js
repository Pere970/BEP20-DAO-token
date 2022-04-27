const BEP20Dao = artifacts.require("BEP20DAOToken");

contract(
    "BEP20 DAO Token", accounts => {
        let token;
        let tokenFee = 10;
        let transferAmount = 100;
        let tokenSupply = 1000;

        beforeEach(async () => {
            token = await BEP20Dao.new("Test Token", "TEST", 1000);
        });

        it("has the given name", async () => {
            const name = await token.name();
            assert.equal(name, "Test Token");
        });

        it("has the given symbol", async () => {
            const symbol = await token.symbol();
            assert.equal(symbol, "TEST");
        });

        it("has the given total supply", async () => {
            const totalSupply = await token.totalSupply();
            assert.equal(totalSupply, tokenSupply*10**18);
        });

        it("assigns the total supply to the creator", async () => {
            const creatorBalance = await token.balanceOf(accounts[0]);
            assert.equal(creatorBalance, tokenSupply*10**18);
        });

        it("transfers tokens", async () => {
            const initialBalance = await token.balanceOf(accounts[0]);
            await token.transfer(accounts[1], transferAmount);
            const balance = await token.balanceOf(accounts[1]);
            const currentBalance = await token.balanceOf(accounts[0]);
            assert.equal(balance, transferAmount);
            assert.equal(currentBalance, initialBalance - transferAmount);
        });

        it("updates the token fee address", async () => {
            const initialAddress = await token._tokenFeeAddress();
            await token.updateTokenFeeAddress(accounts[1]);
            const newAddress = await token._tokenFeeAddress();
            assert.equal(initialAddress, accounts[0]);
            assert.equal(newAddress, accounts[1]);
        });

        it("sends fee when transfering to address with associated fee", async () => {
            await token.updateToWalletFee(accounts[1], tokenFee);
            await token.updateTokenFeeAddress(accounts[2]);
            const initialBalance = await token.balanceOf(accounts[2]);
            await token.transfer(accounts[1], transferAmount);
            const currentBalance = await token.balanceOf(accounts[2]);
            assert.equal(initialBalance, 0);
            assert.equal(currentBalance, transferAmount * tokenFee / 100);
        });

        it("sends fee when transfering from address with associated fee", async () => {
            await token.updateFromWalletFee(accounts[0], tokenFee);
            await token.updateTokenFeeAddress(accounts[2]);
            const initialBalance = await token.balanceOf(accounts[2]);
            await token.transfer(accounts[1], transferAmount);
            const currentBalance = await token.balanceOf(accounts[2]);
            assert.equal(initialBalance, 0);
            assert.equal(currentBalance, transferAmount * tokenFee / 100);
        });

        it("enables checkpoints and tracks account voting power", async () => {
            const initialVotes = await token.getVotes(accounts[0]);
            const initialCheckpoints = await token.numCheckpoints(accounts[0]);
            await token.delegate(accounts[0]);
            const currentVotes = await token.getVotes(accounts[0]);
            const currentCheckpoints = await token.numCheckpoints(accounts[0]);
            assert.equal(initialVotes, 0);
            assert.equal(initialCheckpoints, 0);
            assert.equal(currentVotes, tokenSupply * 10**18);
            assert.equal(currentCheckpoints, 1);
        });

        it("transfers ownership", async () => {
            const initialOwner = await token.owner();
            await token.transferOwnership(accounts[1]);
            const newOwner = await token.owner();
            assert.equal(initialOwner, accounts[0]);
            assert.equal(newOwner, accounts[1]);
            try {
                await token.transferOwnership(accounts[0]);
            } catch (error) {
                expect(error.reason).includes('caller is not the owner');
            }
        });
    }
);