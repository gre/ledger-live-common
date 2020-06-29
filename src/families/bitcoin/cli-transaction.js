// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Transaction, AccountLike } from "../../types";
import { bitcoinPickingStrategy } from "./types";

const options = [
  {
    name: "feePerByte",
    type: String,
    desc: "how much fee per byte",
  },
  {
    name: "pickUnconfirmedRBF",
    type: Boolean,
    desc: "also pick unconfirmed replaceable txs",
  },
  {
    name: "excludeUTXO",
    alias: "E",
    type: String,
    multiple: true,
    desc: "exclude utxo by their txhash@index (example: -E hash@3 -E hash@0)",
  },
  {
    name: "addInputs",
    alias: "I",
    type: String,
    multiple: true,
    desc: "explicitly adding utxo with txhash@index@sequence",
  },
  {
    name: "rbf",
    type: Boolean,
    desc: "enable replace-by-fee",
  },
  {
    name: "disablePickInputs",
    type: Boolean,
    desc: "disable the mecanism of picking utxos",
  },
  {
    name: "bitcoin-pick-strategy",
    type: String,
    desc:
      "utxo picking strategy, one of: " +
      Object.keys(bitcoinPickingStrategy).join(" | "),
  },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike, transaction: Transaction }>,
  opts: Object
): Transaction[] {
  const feePerByte = new BigNumber(
    opts.feePerByte === undefined ? 1 : opts.feePerByte
  );
  return transactions.map(({ transaction }) => {
    invariant(transaction.family === "bitcoin", "bitcoin family");
    let addInputs;
    if (opts.addInputs && opts.addInputs.length > 0) {
      addInputs = opts.addInputs.map((str) => {
        const [hash, index, sequence] = str.split("@");
        invariant(
          hash && index && !isNaN(index),
          "invalid format for --addInputs (-I)"
        );
        invariant(
          sequence && !isNaN(sequence),
          "invalid format for --addInputs (-I) (sequence not an int?)"
        );
        return {
          hash,
          index: parseInt(index, 10),
          sequence: parseInt(sequence, 10),
        };
      });
    }
    return {
      ...transaction,
      feePerByte,
      rbf: opts.rbf || false,
      utxoStrategy: {
        strategy: bitcoinPickingStrategy[opts["bitcoin-pick-strategy"]] || 0,
        pickUnconfirmedRBF: opts.pickUnconfirmedRBF || false,
        disablePickInputs: opts.disablePickInputs || false,
        addInputs,
        excludeUTXOs: (opts.excludeUTXO || []).map((str) => {
          const [hash, index] = str.split("@");
          invariant(
            hash && index && !isNaN(index),
            "invalid format for --excludeUTXO, -E"
          );
          return { hash, outputIndex: parseInt(index, 10) };
        }),
      },
    };
  });
}

export default {
  options,
  inferTransactions,
};
