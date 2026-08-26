import React, { useState } from "react"
import { StaffUser, setStaffAuth } from "../../utils/staffAuth"
import { ChefHatIcon, UserIcon, AlertTriangleIcon, CheckCircleIcon } from "./icons"

export interface StaffAuthModalProps {
  isOpen: boolean
  onClose?: () => void
  onSuccess: (staff: StaffUser, token: string) => void
}

interface PresetAccount {
  name: string
  role: "chef" | "waiter" | "manager"
  roleLabel: string
  email: string
  icon: React.ComponentType<{ className?: string }>
}

const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    name: "Budi",
    role: "chef",
    roleLabel: "Chef (Dapur)",
    email: "budi@sembilu.com",
    icon: ChefHatIcon,
  },
  {
    name: "Wati",
    role: "waiter",
    roleLabel: "Waiter (Pelayan)",
    email: "wati@sembilu.com",
    icon: UserIcon,
  },
  {
    name: "Teguh",
    role: "manager",
    roleLabel: "Manager",
    email: "teguh@sembilu.com",
    icon: CheckCircleIcon,
  },
]

export function StaffAuthModal({ isOpen, onClose, onSuccess }: StaffAuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal masuk. Periksa email & kata sandi.")
      }

      setStaffAuth(data.token, data.staff)
      onSuccess(data.staff, data.token)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (preset: PresetAccount) => {
    handleLogin(preset.email, "password123")
  }

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.")
      return
    }
    handleLogin(email, password)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1b1610] border border-[#392c1e] shadow-2xl p-6 sm:p-8 text-[#f4ead3] overflow-hidden">
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#241c13] border border-[#c9a24b]/40 text-[#c9a24b] mb-3">
            <ChefHatIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-medium tracking-wide text-[#f4ead3]">
            Autentikasi Kitchen Display
          </h2>
          <p className="text-sm text-[#cbbf9c] mt-1">
            Pilih akun staf bertugas atau masuk dengan email & kata sandi
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#b84a30]/15 border border-[#b84a30]/40 flex items-center gap-3 text-[#f4ead3]">
            <AlertTriangleIcon className="w-5 h-5 text-[#b84a30] shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* 1-Tap Quick Login Preset Grid */}
        <div className="mb-6">
          <label className="block text-xs uppercase font-mono tracking-wider text-[#a48f6e] mb-3 font-semibold">
            Masuk Cepat (Preset Staf)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_ACCOUNTS.map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(preset)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl min-h-[88px] bg-[#241c13] border border-[#392c1e] hover:border-[#c9a24b] hover:bg-[#2e2318] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group text-center"
                >
                  <Icon className="w-6 h-6 text-[#c9a24b] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-[#f4ead3] text-sm leading-tight">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-[#a48f6e] mt-0.5">
                    {preset.roleLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Manual Login Accordion / Toggle */}
        <div className="border-t border-[#392c1e] pt-4">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between text-xs text-[#a48f6e] hover:text-[#c9a24b] transition-colors py-2 cursor-pointer"
          >
            <span>Masuk manual dengan email & kata sandi</span>
            <span className="font-mono">{showManual ? "▲ Tutup" : "▼ Buka"}</span>
          </button>

          {showManual && (
            <form onSubmit={handleSubmitManual} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-[#cbbf9c] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@sembilu.com"
                  className="w-full min-h-[44px] px-4 rounded-lg bg-[#14110d] border border-[#392c1e] text-[#f4ead3] placeholder-[#665544] focus:border-[#c9a24b] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#cbbf9c] mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-4 rounded-lg bg-[#14110d] border border-[#392c1e] text-[#f4ead3] placeholder-[#665544] focus:border-[#c9a24b] focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] px-4 rounded-lg bg-[#c9a24b] text-[#14110d] font-semibold text-sm hover:bg-[#e7c57a] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>
          )}
        </div>

        {/* Modal Close option if dismissible */}
        {onClose && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#a48f6e] hover:text-[#f4ead3] underline transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
