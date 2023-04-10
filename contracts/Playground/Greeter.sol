//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract Greeter {
    event _setGreeting(string greeting);
    string private greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit _setGreeting(greeting);
    }
}