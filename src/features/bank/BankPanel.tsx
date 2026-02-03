import { useGame } from '../../context/GameContext';
import { Landmark } from 'lucide-react';

export const BankPanel: React.FC<{ className?: string }> = ({ className }) => {
    const { state, dispatch } = useGame();
    const { game } = state;

    const takeLoan = (amount: number) => {
        dispatch({ type: 'TAKE_LOAN', payload: amount });
    };

    const repayLoan = (loanId: string) => {
        dispatch({ type: 'REPAY_LOAN', payload: loanId });
    };

    const totalDailyPayment = game.loans.reduce((acc, loan) => acc + loan.dailyPayment, 0);

    return (
        <div className={className || "glass-panel w-96 h-full p-4 pointer-events-auto animate-slide-in flex flex-col"}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Landmark className="text-blue-400" />
                    First Bank of Europe
                </h2>
                <div className="text-right">
                    <div className="text-xs text-slate-400">Current Balance</div>
                    <div className="text-xl font-bold text-green-400">€ {game.money.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Financial Status</div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Total Loans</span>
                    <span className="text-sm font-bold text-white">€ {game.loans.reduce((acc, l) => acc + l.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Daily Interest (1%)</span>
                    <span className="text-sm font-bold text-red-400">- € {totalDailyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Loan Offers</div>
                <div className="grid grid-cols-2 gap-3">
                    {[10000, 50000, 100000, 500000].map(amount => (
                        <button
                            key={amount}
                            onClick={() => takeLoan(amount)}
                            className="p-3 rounded bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700 transition-all flex flex-col items-center gap-1"
                        >
                            <span className="text-sm font-bold text-white">€ {amount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400">{(amount * 0.01).toLocaleString()}/day</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Active Loans</div>
                {game.loans.length === 0 ? (
                    <div className="text-center text-slate-500 py-4 text-sm">
                        No active loans. You are debt free!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {game.loans.map(loan => (
                            <div key={loan.id} className="p-3 bg-slate-800/30 rounded border border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-200">€ {loan.amount.toLocaleString()}</span>
                                    <span className="text-xs text-red-400">1% Interest</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Payment: € {loan.dailyPayment}/day</span>
                                    <button
                                        onClick={() => repayLoan(loan.id)}
                                        disabled={game.money < loan.amount}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors
                                            ${game.money >= loan.amount
                                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                        `}
                                    >
                                        Repay Full
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
