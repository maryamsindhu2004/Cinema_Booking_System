-- Trigger scripts for the Cinema Booking System
-- Keep trigger definitions separate from the main schema for better organization.

CREATE TRIGGER trg_UpdateFoodTotal
ON FoodOrderItems
AFTER INSERT
AS
BEGIN
    UPDATE fo
    SET total_amount = (
        SELECT SUM(foi.quantity * ci.price)
        FROM FoodOrderItems foi
        JOIN ConcessionItems ci ON foi.item_id = ci.item_id
        WHERE foi.food_order_id = fo.food_order_id
    )
    FROM FoodOrders fo
    JOIN inserted i ON fo.food_order_id = i.food_order_id;
END;
GO
