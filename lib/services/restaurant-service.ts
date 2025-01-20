import { Restaurant } from "@prisma/client"

type CreateRestaurantData = {
  name: string
  cnpj: string
  address?: string
  phone?: string
}

type UpdateRestaurantData = Partial<CreateRestaurantData>

export const restaurantService = {
  async createRestaurant(data: CreateRestaurantData) {
    const response = await fetch("/api/restaurants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    
    return response.json()
  },

  async updateRestaurant(id: string, data: UpdateRestaurantData) {
    const response = await fetch(`/api/restaurants/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    
    return response.json()
  },

  async deleteRestaurant(id: string) {
    const response = await fetch(`/api/restaurants/${id}`, {
      method: "DELETE"
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    return response.json()
  },

  async getRestaurants() {
    const response = await fetch("/api/restaurants")
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    
    return response.json()
  },

  async getRestaurant(id: string) {
    const response = await fetch(`/api/restaurants/${id}`)
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }
    
    return response.json()
  }
}
