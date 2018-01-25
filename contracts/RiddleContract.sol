pragma solidity ^0.4.17;

import 'installed_contracts/zeppelin/contracts/token/ERC20.sol';

contract RiddleContract {

  ERC20 token;

  function RiddleContract(address tokenAddress) public {
    token = ERC20(tokenAddress);
  }

  /* ---------- */

  struct Riddle {
    bool exists;
    bool solved;
    uint256 reward;
    address asker;
    address solver;
    string question;
    string answer;
  }
  mapping(bytes32 => Riddle) riddles;
  bytes32[] riddleKeys;
  
  /* ---------- */

  event Solved(
    string question, 
    string answer, 
    address solver, 
    uint256 reward, 
    bytes32 answerHash);

  /* ---------- */

  function generateHash (string answer) public pure returns (bytes32 answerHash) {
    return keccak256(answer);
  }

  function getRiddleCount () public view returns (
    uint256 riddleCount
  ) {
    return riddleKeys.length;
  }

  function getRiddleAtKey (uint256 key) public view returns (
    bool exists, 
    bool solved, 
    uint256 reward, 
    address asker, 
    address solver, 
    string question, 
    string answer
  ) {
    bytes32 qa = riddleKeys[key];
    return getRiddleAtHash(qa);
  }

    function getRiddleAtHash (bytes32 qa) public view returns (
    bool exists, 
    bool solved, 
    uint256 reward, 
    address asker, 
    address solver, 
    string question, 
    string answer
  ) {
    Riddle storage riddle = riddles[qa];
    return (
      riddle.exists, 
      riddle.solved, 
      riddle.reward, 
      riddle.asker, 
      riddle.solver, 
      riddle.question, 
      riddle.answer);
    }

  /* ---------- */

  function askRiddle(string question, bytes32 answerHash, uint256 value) public {
    bytes32 qa = keccak256(question, answerHash);
    if (riddles[qa].exists) revert();
    if (value == 0) revert();
    if (!token.transferFrom(msg.sender, address(this), value)) revert();
    riddles[qa].exists = true;
    riddles[qa].reward = value;
    riddles[qa].asker = msg.sender;
    riddles[qa].question = question;
    riddleKeys.push(qa);
  }

  function answerRiddle (string question, string answer) public {
    bytes32 answerHash = keccak256(answer);
    bytes32 qa = keccak256(question, answerHash);
    if (!riddles[qa].exists || riddles[qa].solved) revert();

    riddles[qa].solved = true;
    riddles[qa].solver = msg.sender;
    riddles[qa].answer = answer;

    if (!token.transfer(msg.sender, riddles[qa].reward)) revert();
    Riddle storage riddle = riddles[qa];
    Solved(
      riddle.question, 
      riddle.answer, 
      riddle.solver, 
      riddle.reward, 
      answerHash);
  }

}
