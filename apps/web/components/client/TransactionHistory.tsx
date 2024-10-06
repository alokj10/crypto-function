"use client"
import React, { useState, useEffect } from 'react';
import { Table } from '@repo/ui/table';
import { ColumnDef } from '@tanstack/react-table';
import { getTransactionsBySenderId } from '../../app/lib/actions/solana/salaryTransaction';
import { CurrentUserState } from "../../app/store/clientAddState";
import { useRecoilState } from "recoil";
import { Card } from '@repo/ui/card';

interface Transaction {
  senderName: string;
  receiverName: string;
  amount: number;
  date: string;
}

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUserState, setCurrentUserState] = useRecoilState(CurrentUserState);

  useEffect(() => {
    const fetchTransactions = async () => {
        if(!currentUserState?.id) {
            return;
        }
      let salaryDetails = await getTransactionsBySenderId(currentUserState?.id);
      console.log('salaryDetails-history', salaryDetails);
      const formattedTransactions = salaryDetails.map(detail => ({
        senderName: detail.Sender.name, // You might want to fetch actual names
        receiverName: detail.Receiver.name, // You might want to fetch actual names
        amount: detail.Amount,
        date: new Date(detail.Date).toLocaleDateString(),
      }));
      setTransactions(formattedTransactions);
    };

    fetchTransactions();
  }, [currentUserState]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'senderName',
      header: 'Sender Name',
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver Name',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `${row.original.amount} SOL`,
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
  ];

  return (
      <Card title='Transaction History'>
        <Table data={transactions} columns={columns} />
      </Card>
  );
};