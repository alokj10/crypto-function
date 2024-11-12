"use client"
import React, { useState, useEffect } from 'react';
import { Table } from '@repo/ui/table';
import { ColumnDef } from '@tanstack/react-table';
import { getTransactionsBySenderId } from '../../app/lib/actions/solana/salaryTransaction';
import { CurrentUserState } from "../../app/store/clientAddState";
import { useRecoilState } from "recoil";
import { Card } from '@repo/ui/card';
import { date } from 'zod';

interface Transaction {
  senderName: string;
  receiverName: string;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  date: string;
}

const FormatDateTime = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
};

export const TransactionHistory = (
  {
    cardTitle
  }: any
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUserState, setCurrentUserState] = useRecoilState(CurrentUserState);

  useEffect(() => {
    const fetchTransactions = async () => {
        if(!currentUserState?.id) {
            return;
        }
      let salaryDetails = await getTransactionsBySenderId(currentUserState?.id);
      console.log('salaryDetails-history', salaryDetails);
      let formattedTransactions = salaryDetails.map(detail => ({
        senderName: detail.Sender.name, // You might want to fetch actual names
        receiverName: (detail.Sender.name == detail.Receiver.name) ? '' : detail.Receiver.name+' - ', // You might want to fetch actual names
        senderWallet: detail.SenderWallet,
        receiverWallet: detail.ReceiverWallet,
        amount: detail.Amount,
        // date: new Date(detail.Date).toString(),
        date: FormatDateTime(detail.Date)
      }));
      setTransactions(formattedTransactions);
    };

    fetchTransactions();
  }, [currentUserState]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'senderName',
      header: 'Sender',
      cell: ({ row }) => `${row.original.senderName} - ${row.original.senderWallet}`,
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
      cell: ({ row }) => `${row.original.receiverName}  ${row.original.receiverWallet}`,
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
      <Card title={cardTitle}>
        <Table data={transactions} columns={columns} />
      </Card>
  );
};
