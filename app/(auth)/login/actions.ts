'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/map', 'layout')
    redirect('/map')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    const supabase = await createClient()

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.user) {
        // Map immediately since Supabase Auth might auto-confirm or return session
        const existingUser = await prisma.aPP_USER.findFirst({
            where: { email: data.user.email },
        })

        if (!existingUser && data.user.email) {
            const dummyHash = await bcrypt.hash('supabase-auth', 10)
            const username = data.user.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000)

            await prisma.aPP_USER.create({
                data: {
                    email: data.user.email,
                    username: username,
                    password: dummyHash,
                    name: name || username,
                }
            })
        }
    }

    revalidatePath('/map', 'layout')
    redirect('/map')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
