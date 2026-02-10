create view InventoryView as (
select 
s.ItemNumber,
s.[Description],
c.ColorName,
si.SizeName,
i.Qty,
se.SeasonName,
i.InStock,
i.InventoryId, 
i.ItemColorId,
s.ItemId,
c.ColorId,
i.SizeId,
se.SeasonId
from Inventory i
join ItemColor sc 
on i.ItemColorId = sc.ItemColorId
join Item s 
on sc.ItemId = s.ItemId
join Season se 
on se.SeasonId = s.SeasonId
join Color c 
on sc.ColorId = c.ColorId
join Sizes si 
on i.SizeId = si.SizeId)
