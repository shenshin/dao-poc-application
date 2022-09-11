// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface Application {
  function getWidth() external pure returns (uint256);
}

abstract contract Window is Application {
    function getWidth() public pure virtual returns (uint256) {
        return 1;
    }
}

abstract contract Document is Application, Window {
    function getWidth() public pure virtual override(Application, Window) returns (uint256) {
        return 2;
    }
}

// inheritance order matters! 
contract HTML is Application, Window, Document {
    function getWidth()
        public
        pure
        // override order doesn't matter!
        override(Application, Window, Document)
        returns (uint256)
    { 
        // to get deeper ancestor, call it explicitly
        uint windowWidth = Window.getWidth();
        // `super` references the nearest ancestor
        uint documentWidth = super.getWidth();
        return windowWidth > documentWidth ? windowWidth : documentWidth;
    }
}
