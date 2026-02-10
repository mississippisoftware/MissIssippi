use MissIssippiDB
go
delete ItemImage
go
delete Sku
go
delete ImageType
go
delete Inventory 
go
delete ItemColor
go
delete Item 
go
delete Season 
go
delete Color 
go
delete Sizes 
go

insert Sizes(SizeName, SizeSequence)
        select '12', 1
union select 'XXS', 2
union select 'XS', 3
union select 'S', 4
union select 'M', 5
union select 'L', 6
union select 'XL', 7

insert ImageType([Type], Sequence)
      select 'Main', 1
union select 'Secondary', 2
union select 'Back', 3
union select 'Detail', 4
union select 'Group', 5

insert Color(ColorName, SeasonId, PantoneColor, HexValue)
      select 'Navy', null, null, null
union select 'Kelly', null, null, null
union select 'Eggplant', null, null, null
union select 'Port Wine', null, null, null
union select 'Turquoise', null, null, null
union select 'Turquoise/Ivory', null, null, null
union select 'Plum', null, null, null
union select 'Ivory', null, null, null
union select 'Black', null, null, null
union select 'Black', null, null, null
union select 'Ivory', null, null, null
union select 'Royal', null, null, null
union select 'Fuchsia', null, null, null
union select 'Mustard', null, null, null
union select 'Pink', null, null, null
union select 'Rust', null, null, null
union select 'Plum/Rust', null, null, null
union select 'Forest Green', null, null, null
union select 'Grey', null, null, null
union select 'Corn Blue', null, null, null
union select 'Oatmeal', null, null, null
union select 'Lime', null, null, null
union select 'Mint', null, null, null
union select 'Mint/Fuchsia', null, null, null
union select 'Burgundy', null, null, null
union select 'Wine', null, null, null
union select 'Royal', null, null, null
union select 'Teal', null, null, null
union select 'Black', null, null, null
union select 'Dark Burgundy', null, null, null
union select 'Eggplant', null, null, null
union select 'Olive', null, null, null
union select 'Teal', null, null, null
union select 'Peach', null, null, null
union select 'Natural', null, null, null
union select 'Ivory/Black', null, null, null
union select 'Dazzle/Black', null, null, null
union select 'Admiral Blue', null, null, null
union select 'Dark Rust', null, null, null
union select 'Dazzle Blue', null, null, null
union select 'Mauve', null, null, null
union select 'Lavender', null, null, null
union select 'Admiral', null, null, null
union select 'Lt Blue', null, null, null
union select 'Ivory/Eggplant', null, null, null
union select 'Mid Blue', null, null, null
union select 'Ivory', null, null, null

insert Season(SeasonName, SeasonDateCreated, Active)
    select 'AW25', GETDATE(), 1
union select 'Legacy', GETDATE(), 1



;with x as (
      select ItemNumber = '701', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '702', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '703', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '704', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '705', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '705B', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '706', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '707', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '708', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '709', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '710', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '711', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '712', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '713', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '714', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '715', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '716', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '717', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '718', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '719', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '720', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '721', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '722', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '723', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '724', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '725', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '740', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '741', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '742', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '743', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '744', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '745', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '746', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '801', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '802', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '804', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '805', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '806', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '807', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '809', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '810', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '811', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '812', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '813', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '814', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '815', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '816', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '817', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '818', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '819', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '820', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '822', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '823', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '824', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '825', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '826', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '827', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '828', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '829', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '830', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '831', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '832', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '833', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '834', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '840', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '841', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '842', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '843', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '844', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '845', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '846', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '847', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '848', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '849', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '850', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '851', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '852', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '853', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '854', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '855', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0
union select ItemNumber = '856', [Description] = 'sample data', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', ItemDateCreated = GETDATE(), InProduction = 0

)
insert into Item(ItemNumber, [Description], CostPrice, WholesalePrice, SeasonId, ItemDateCreated, InProduction)
select x.ItemNumber, x.[Description], x.CostPrice, x.WholesalePrice, s.SeasonId, x.ItemDateCreated, x.InProduction
from x   
join Season s 
on x.SeasonName = s.SeasonName


;with x as (
      select ItemNumber = '701', ColorName = 'Navy'
union select ItemNumber = '702', ColorName = 'Kelly'
union select ItemNumber = '702', ColorName = 'Navy'
union select ItemNumber = '703', ColorName = 'Eggplant'
union select ItemNumber = '703', ColorName = 'Navy'
union select ItemNumber = '703', ColorName = 'Port Wine'
union select ItemNumber = '703', ColorName = 'Turquoise'
union select ItemNumber = '703', ColorName = 'Turquoise/Ivory'
union select ItemNumber = '704', ColorName = 'Plum'
union select ItemNumber = '704', ColorName = 'Ivory'
union select ItemNumber = '704', ColorName = 'Kelly'
union select ItemNumber = '705', ColorName = 'Black'
union select ItemNumber = '705B', ColorName = 'Black'
union select ItemNumber = '705', ColorName = 'Ivory'
union select ItemNumber = '705B', ColorName = 'Ivory'
union select ItemNumber = '706', ColorName = 'Royal'
union select ItemNumber = '706', ColorName = 'Fuchsia'
union select ItemNumber = '706', ColorName = 'Kelly'
union select ItemNumber = '707', ColorName = 'Mustard'
union select ItemNumber = '707', ColorName = 'Pink'
union select ItemNumber = '707', ColorName = 'Rust'
union select ItemNumber = '708', ColorName = 'Ivory'
union select ItemNumber = '708', ColorName = 'Plum/Rust'
union select ItemNumber = '709', ColorName = 'Forest Green'
union select ItemNumber = '709', ColorName = 'Port Wine'
union select ItemNumber = '710', ColorName = 'Black'
union select ItemNumber = '710', ColorName = 'Ivory'
union select ItemNumber = '711', ColorName = 'Grey'
union select ItemNumber = '711', ColorName = 'Ivory'
union select ItemNumber = '712', ColorName = 'Corn Blue'
union select ItemNumber = '712', ColorName = 'Mustard'
union select ItemNumber = '712', ColorName = 'Oatmeal'
union select ItemNumber = '712', ColorName = 'Rust'
union select ItemNumber = '713', ColorName = 'Rust'
union select ItemNumber = '714', ColorName = 'Corn Blue'
union select ItemNumber = '714', ColorName = 'Ivory'
union select ItemNumber = '715', ColorName = 'Eggplant'
union select ItemNumber = '716', ColorName = 'Eggplant'
union select ItemNumber = '716', ColorName = 'Lime'
union select ItemNumber = '717', ColorName = 'Black'
union select ItemNumber = '717', ColorName = 'Corn Blue'
union select ItemNumber = '717', ColorName = 'Eggplant'
union select ItemNumber = '718', ColorName = 'Black'
union select ItemNumber = '718', ColorName = 'Ivory'
union select ItemNumber = '719', ColorName = 'Corn Blue'
union select ItemNumber = '719', ColorName = 'Mint'
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia'
union select ItemNumber = '720', ColorName = 'Burgundy'
union select ItemNumber = '720', ColorName = 'Eggplant'
union select ItemNumber = '720', ColorName = 'Ivory'
union select ItemNumber = '720', ColorName = 'Mustard'
union select ItemNumber = '721', ColorName = 'Eggplant'
union select ItemNumber = '721', ColorName = 'Wine'
union select ItemNumber = '722', ColorName = 'Ivory'
union select ItemNumber = '722', ColorName = 'Kelly'
union select ItemNumber = '722', ColorName = 'Mustard'
union select ItemNumber = '722', ColorName = 'Royal'
union select ItemNumber = '723', ColorName = 'Eggplant'
union select ItemNumber = '723', ColorName = 'Kelly'
union select ItemNumber = '723', ColorName = 'Ivory'
union select ItemNumber = '723', ColorName = 'Wine'
union select ItemNumber = '724', ColorName = 'Grey'
union select ItemNumber = '724', ColorName = 'Port Wine'
union select ItemNumber = '724', ColorName = 'Ivory'
union select ItemNumber = '724', ColorName = 'Royal'
union select ItemNumber = '725', ColorName = 'Black'
union select ItemNumber = '725', ColorName = 'Grey'
union select ItemNumber = '725', ColorName = 'Navy'
union select ItemNumber = '725', ColorName = 'Ivory'
union select ItemNumber = '740', ColorName = 'Black'
union select ItemNumber = '740', ColorName = 'Teal'
union select ItemNumber = '741', ColorName = 'Black'
union select ItemNumber = '741', ColorName = 'Dark Burgundy'
union select ItemNumber = '741', ColorName = 'Eggplant '
union select ItemNumber = '741', ColorName = 'Olive'
union select ItemNumber = '741', ColorName = 'Teal'
union select ItemNumber = '742', ColorName = 'Black'
union select ItemNumber = '742', ColorName = 'Teal'
union select ItemNumber = '743', ColorName = 'Black'
union select ItemNumber = '744', ColorName = 'Black'
union select ItemNumber = '744', ColorName = 'Pink'
union select ItemNumber = '745', ColorName = 'Grey'
union select ItemNumber = '745', ColorName = 'Port Wine'
union select ItemNumber = '746', ColorName = 'Black'
union select ItemNumber = '801', ColorName = 'Ivory'
union select ItemNumber = '801', ColorName = 'Royal'
union select ItemNumber = '802', ColorName = 'Navy'
union select ItemNumber = '802', ColorName = 'Peach'
union select ItemNumber = '804', ColorName = 'Natural'
union select ItemNumber = '805', ColorName = 'Royal'
union select ItemNumber = '806', ColorName = 'Ivory'
union select ItemNumber = '806', ColorName = 'Ivory/Black'
union select ItemNumber = '806', ColorName = 'Dazzle/Black'
union select ItemNumber = '806', ColorName = 'Navy'
union select ItemNumber = '807', ColorName = 'Admiral Blue'
union select ItemNumber = '807', ColorName = 'Dark Rust'
union select ItemNumber = '809', ColorName = 'Dazzle Blue'
union select ItemNumber = '809', ColorName = 'Eggplant'
union select ItemNumber = '809', ColorName = 'Ivory'
union select ItemNumber = '810', ColorName = 'Black'
union select ItemNumber = '810', ColorName = 'Ivory'
union select ItemNumber = '811', ColorName = 'Navy'
union select ItemNumber = '812', ColorName = 'Black'
union select ItemNumber = '812', ColorName = 'Mauve'
union select ItemNumber = '812', ColorName = 'Natural'
union select ItemNumber = '812', ColorName = 'Navy'
union select ItemNumber = '813', ColorName = 'Dark Burgundy'
union select ItemNumber = '813', ColorName = 'Lavender'
union select ItemNumber = '813', ColorName = 'Navy'
union select ItemNumber = '814', ColorName = 'Admiral'
union select ItemNumber = '814', ColorName = 'Wine'
union select ItemNumber = '815', ColorName = 'Navy'
union select ItemNumber = '816', ColorName = 'Eggplant'
union select ItemNumber = '816', ColorName = 'Port Wine'
union select ItemNumber = '817', ColorName = 'Eggplant'
union select ItemNumber = '817', ColorName = 'Lt Blue'
union select ItemNumber = '817', ColorName = 'Navy'
union select ItemNumber = '818', ColorName = 'Navy'
union select ItemNumber = '818', ColorName = 'Admiral Blue'
union select ItemNumber = '818', ColorName = 'Eggplant'
union select ItemNumber = '818', ColorName = 'Port Wine'
union select ItemNumber = '819', ColorName = 'Ivory'
union select ItemNumber = '819', ColorName = 'Mauve'
union select ItemNumber = '819', ColorName = 'Port Wine'
union select ItemNumber = '820', ColorName = 'Dark Rust'
union select ItemNumber = '820', ColorName = 'Natural'
union select ItemNumber = '820', ColorName = 'Port Wine'
union select ItemNumber = '822', ColorName = 'Admiral'
union select ItemNumber = '822', ColorName = 'Black'
union select ItemNumber = '822', ColorName = 'Ivory'
union select ItemNumber = '822', ColorName = 'Eggplant'
union select ItemNumber = '822', ColorName = 'Port Wine'
union select ItemNumber = '823', ColorName = 'Eggplant'
union select ItemNumber = '823', ColorName = 'Ivory'
union select ItemNumber = '823', ColorName = 'Port Wine'
union select ItemNumber = '824', ColorName = 'Black'
union select ItemNumber = '824', ColorName = 'Ivory'
union select ItemNumber = '825', ColorName = 'Black'
union select ItemNumber = '825', ColorName = 'Ivory'
union select ItemNumber = '825', ColorName = 'Ivory/Black'
union select ItemNumber = '825', ColorName = 'Ivory/Eggplant'
union select ItemNumber = '826', ColorName = 'Teal'
union select ItemNumber = '826', ColorName = 'Ivory'
union select ItemNumber = '826', ColorName = 'Turquoise'
union select ItemNumber = '827', ColorName = 'Black'
union select ItemNumber = '827', ColorName = 'Ivory'
union select ItemNumber = '828', ColorName = 'Ivory'
union select ItemNumber = '828', ColorName = 'Pink'
union select ItemNumber = '829', ColorName = 'Black'
union select ItemNumber = '829', ColorName = 'Ivory'
union select ItemNumber = '829', ColorName = 'Pink'
union select ItemNumber = '830', ColorName = 'Burgundy'
union select ItemNumber = '831', ColorName = 'Burgundy'
union select ItemNumber = '832', ColorName = 'Mid Blue'
union select ItemNumber = '833', ColorName = 'Teal'
union select ItemNumber = '834', ColorName = 'Teal'
union select ItemNumber = '834', ColorName = 'Ivory'
union select ItemNumber = '834', ColorName = 'Turquoise'
union select ItemNumber = '840', ColorName = 'Ivory'
union select ItemNumber = '840', ColorName = 'Navy'
union select ItemNumber = '840', ColorName = 'Black'
union select ItemNumber = '840', ColorName = 'Wine'
union select ItemNumber = '841', ColorName = 'Admiral'
union select ItemNumber = '841', ColorName = 'Black'
union select ItemNumber = '841', ColorName = 'Navy'
union select ItemNumber = '842', ColorName = 'Lavender'
union select ItemNumber = '842', ColorName = 'Navy'
union select ItemNumber = '843', ColorName = 'Black '
union select ItemNumber = '844', ColorName = 'Black'
union select ItemNumber = '844', ColorName = 'Navy'
union select ItemNumber = '844', ColorName = 'Ivory'
union select ItemNumber = '845', ColorName = 'Admiral Blue'
union select ItemNumber = '846', ColorName = 'Dark Rust'
union select ItemNumber = '847', ColorName = 'Black'
union select ItemNumber = '847', ColorName = 'Ivory'
union select ItemNumber = '847', ColorName = 'Wine'
union select ItemNumber = '848', ColorName = 'Black'
union select ItemNumber = '848', ColorName = 'Burgundy'
union select ItemNumber = '848', ColorName = 'Eggplant'
union select ItemNumber = '848', ColorName = 'Navy'
union select ItemNumber = '849', ColorName = 'Dark Burgundy'
union select ItemNumber = '850', ColorName = 'Admiral Blue'
union select ItemNumber = '850', ColorName = 'Eggplant'
union select ItemNumber = '850', ColorName = 'Port Wine'
union select ItemNumber = '851', ColorName = 'Black'
union select ItemNumber = '851', ColorName = 'Eggplant'
union select ItemNumber = '851', ColorName = 'Port Wine'
union select ItemNumber = '852', ColorName = 'Black'
union select ItemNumber = '852', ColorName = 'Wine'
union select ItemNumber = '852', ColorName = 'Ivory'
union select ItemNumber = '852', ColorName = 'Navy'
union select ItemNumber = '852', ColorName = 'Natural'
union select ItemNumber = '853', ColorName = 'Black'
union select ItemNumber = '853', ColorName = 'Ivory'
union select ItemNumber = '853', ColorName = 'Pink'
union select ItemNumber = '854', ColorName = 'Ivory'
union select ItemNumber = '854', ColorName = 'Black'
union select ItemNumber = '855', ColorName = 'Black'
union select ItemNumber = '855', ColorName = 'Ivory'
union select ItemNumber = '855', ColorName = 'Burgundy'
union select ItemNumber = '856', ColorName = 'Black'
union select ItemNumber = '856', ColorName = 'Ivory'
)
insert into ItemColor(ItemId, ColorId)
select s.ItemId, c.ColorId
from x 
join Item s 
on x.ItemNumber = s.ItemNumber 
join Color c 
on x.ColorName = c.ColorName

;with skuBase as (
    select sc.ItemColorId,
           sz.SizeId,
           SeasonName = se.SeasonName,
           ItemNumber = st.ItemNumber,
           ColorCode = dbo.fn_NormalizeSkuColor(c.ColorName),
           SizeName = sz.SizeName
    from ItemColor sc
    join Item st
    on sc.ItemId = st.ItemId
    join Season se
    on st.SeasonId = se.SeasonId
    join Color c
    on sc.ColorId = c.ColorId
    cross join Sizes sz
)
insert into Sku(ItemColorId, SizeId, Sku)
select ItemColorId,
       SizeId,
       '*' + upper(SeasonName) + upper(ItemNumber)
         + left(
             ColorCode,
             case
               when 25 - (2 + len(SeasonName) + len(ItemNumber) + len(SizeName)) < 0 then 0
               else 25 - (2 + len(SeasonName) + len(ItemNumber) + len(SizeName))
             end
           )
         + upper(SizeName) + '*'
from skuBase


;with x as ( 
    select ItemNumber = '702', ColorName = 'Kelly', SizeName='XXS', Qty = 1
union select ItemNumber = '702', ColorName = 'Kelly', SizeName='XS', Qty = 2
union select ItemNumber = '702', ColorName = 'Kelly', SizeName='S', Qty = 3
union select ItemNumber = '702', ColorName = 'Kelly', SizeName='M', Qty = 4
union select ItemNumber = '702', ColorName = 'Kelly', SizeName='L', Qty = 5
union select ItemNumber = '702', ColorName = 'Kelly', SizeName='XL', Qty = 6
union select ItemNumber = '702', ColorName = 'Navy', SizeName='12', Qty = 7
union select ItemNumber = '702', ColorName = 'Navy', SizeName='XXS', Qty = 8
union select ItemNumber = '702', ColorName = 'Navy', SizeName='XS', Qty = 9
union select ItemNumber = '702', ColorName = 'Navy', SizeName='S', Qty = 10
union select ItemNumber = '702', ColorName = 'Navy', SizeName='M', Qty = 1
union select ItemNumber = '702', ColorName = 'Navy', SizeName='L', Qty = 2
union select ItemNumber = '702', ColorName = 'Navy', SizeName='XL', Qty = 3
union select ItemNumber = '717', ColorName = 'Black', SizeName='12', Qty = 4
union select ItemNumber = '717', ColorName = 'Black', SizeName='XXS', Qty = 5
union select ItemNumber = '717', ColorName = 'Black', SizeName='XS', Qty = 6
union select ItemNumber = '717', ColorName = 'Black', SizeName='S', Qty = 7
union select ItemNumber = '717', ColorName = 'Black', SizeName='M', Qty = 8
union select ItemNumber = '717', ColorName = 'Black', SizeName='L', Qty = 9
union select ItemNumber = '717', ColorName = 'Black', SizeName='XL', Qty = 10
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='12', Qty = 11
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='XXS', Qty = 12
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='XS', Qty = 13
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='S', Qty = 1
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='M', Qty = 2
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='L', Qty = 3
union select ItemNumber = '717', ColorName = 'Corn Blue', SizeName='XL', Qty = 4
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='12', Qty = 5
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='XXS', Qty = 6
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='XS', Qty = 7
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='S', Qty = 8
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='M', Qty = 9
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='L', Qty = 10
union select ItemNumber = '717', ColorName = 'Eggplant', SizeName='XL', Qty = 11
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='12', Qty = 12
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='XXS', Qty = 13
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='XS', Qty = 1
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='S', Qty = 2
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='M', Qty = 3
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='L', Qty = 4
union select ItemNumber = '719', ColorName = 'Corn Blue', SizeName='XL', Qty = 5
union select ItemNumber = '719', ColorName = 'Mint', SizeName='12', Qty = 6
union select ItemNumber = '719', ColorName = 'Mint', SizeName='XXS', Qty = 7
union select ItemNumber = '719', ColorName = 'Mint', SizeName='XS', Qty = 8
union select ItemNumber = '719', ColorName = 'Mint', SizeName='S', Qty = 9
union select ItemNumber = '719', ColorName = 'Mint', SizeName='M', Qty = 10
union select ItemNumber = '719', ColorName = 'Mint', SizeName='L', Qty = 11
union select ItemNumber = '719', ColorName = 'Mint', SizeName='XL', Qty = 12
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='12', Qty = 13
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XXS', Qty = 1
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XS', Qty = 2
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='S', Qty = 3
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='M', Qty = 4
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='L', Qty = 5
union select ItemNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XL', Qty = 6
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='12', Qty = 7
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='XXS', Qty = 8
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='XS', Qty = 9
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='S', Qty = 10
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='M', Qty = 11
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='L', Qty = 12
union select ItemNumber = '720', ColorName = 'Burgundy', SizeName='XL', Qty = 13
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='12', Qty = 1
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='XXS', Qty = 2
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='XS', Qty = 3
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='S', Qty = 4
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='M', Qty = 5
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='L', Qty = 6
union select ItemNumber = '720', ColorName = 'Eggplant', SizeName='XL', Qty = 7
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='12', Qty = 8
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='XXS', Qty = 9
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='XS', Qty = 10
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='S', Qty = 11
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='M', Qty = 12
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='L', Qty = 13
union select ItemNumber = '720', ColorName = 'Ivory', SizeName='XL', Qty = 1
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='12', Qty = 2
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='XXS', Qty = 3
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='XS', Qty = 4
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='S', Qty = 5
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='M', Qty = 6
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='L', Qty = 7
union select ItemNumber = '720', ColorName = 'Mustard', SizeName='XL', Qty = 8
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='12', Qty = 9
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='XXS', Qty = 10
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='XS', Qty = 11
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='S', Qty = 12
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='M', Qty = 13
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='L', Qty = 1
union select ItemNumber = '722', ColorName = 'Ivory', SizeName='XL', Qty = 2
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='12', Qty = 3
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='XXS', Qty = 4
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='XS', Qty = 5
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='S', Qty = 6
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='M', Qty = 7
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='L', Qty = 8
union select ItemNumber = '722', ColorName = 'Kelly', SizeName='XL', Qty = 9
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='12', Qty = 10
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='XXS', Qty = 11
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='XS', Qty = 12
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='S', Qty = 13
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='M', Qty = 1
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='L', Qty = 2
union select ItemNumber = '722', ColorName = 'Mustard', SizeName='XL', Qty = 3
union select ItemNumber = '722', ColorName = 'Royal', SizeName='12', Qty = 4
union select ItemNumber = '722', ColorName = 'Royal', SizeName='XXS', Qty = 5
union select ItemNumber = '722', ColorName = 'Royal', SizeName='XS', Qty = 6
union select ItemNumber = '722', ColorName = 'Royal', SizeName='S', Qty = 7
union select ItemNumber = '722', ColorName = 'Royal', SizeName='M', Qty = 8
union select ItemNumber = '722', ColorName = 'Royal', SizeName='L', Qty = 9
union select ItemNumber = '722', ColorName = 'Royal', SizeName='XL', Qty = 10
union select ItemNumber = '724', ColorName = 'Grey', SizeName='12', Qty = 11
union select ItemNumber = '724', ColorName = 'Grey', SizeName='XXS', Qty = 12
union select ItemNumber = '724', ColorName = 'Grey', SizeName='XS', Qty = 13
union select ItemNumber = '724', ColorName = 'Grey', SizeName='S', Qty = 1
union select ItemNumber = '724', ColorName = 'Grey', SizeName='M', Qty = 2
union select ItemNumber = '724', ColorName = 'Grey', SizeName='L', Qty = 3
union select ItemNumber = '724', ColorName = 'Grey', SizeName='XL', Qty = 4
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='12', Qty = 5
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='XXS', Qty = 6
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='XS', Qty = 7
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='S', Qty = 8
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='M', Qty = 9
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='L', Qty = 10
union select ItemNumber = '724', ColorName = 'Port Wine', SizeName='XL', Qty = 11
union select ItemNumber = '724', ColorName = 'Royal', SizeName='12', Qty = 12
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XXS', Qty = 13
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XS', Qty = 1
union select ItemNumber = '724', ColorName = 'Royal', SizeName='S', Qty = 2
union select ItemNumber = '724', ColorName = 'Royal', SizeName='M', Qty = 3
union select ItemNumber = '724', ColorName = 'Royal', SizeName='L', Qty = 4
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XL', Qty = 5
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='12', Qty = 6
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='XXS', Qty = 7
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='XS', Qty = 8
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='S', Qty = 9
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='M', Qty = 10
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='L', Qty = 11
union select ItemNumber = '724', ColorName = 'Ivory', SizeName='XL', Qty = 12
union select ItemNumber = '724', ColorName = 'Royal', SizeName='12', Qty = 13
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XXS', Qty = 1
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XS', Qty = 2
union select ItemNumber = '724', ColorName = 'Royal', SizeName='S', Qty = 3
union select ItemNumber = '724', ColorName = 'Royal', SizeName='M', Qty = 4
union select ItemNumber = '724', ColorName = 'Royal', SizeName='L', Qty = 5
union select ItemNumber = '724', ColorName = 'Royal', SizeName='XL', Qty = 6
union select ItemNumber = '725', ColorName = 'Black', SizeName='12', Qty = 7
union select ItemNumber = '725', ColorName = 'Black', SizeName='XXS', Qty = 8
union select ItemNumber = '725', ColorName = 'Black', SizeName='XS', Qty = 9
union select ItemNumber = '725', ColorName = 'Black', SizeName='S', Qty = 10
union select ItemNumber = '725', ColorName = 'Black', SizeName='M', Qty = 11
union select ItemNumber = '725', ColorName = 'Black', SizeName='L', Qty = 12
union select ItemNumber = '725', ColorName = 'Black', SizeName='XL', Qty = 13
union select ItemNumber = '725', ColorName = 'Grey', SizeName='12', Qty = 1

union select ItemNumber = '725', ColorName = 'Grey', SizeName='XXS', Qty = 2

union select ItemNumber = '725', ColorName = 'Grey', SizeName='XS', Qty = 3

union select ItemNumber = '725', ColorName = 'Grey', SizeName='S', Qty = 4

union select ItemNumber = '725', ColorName = 'Grey', SizeName='M', Qty = 5

union select ItemNumber = '725', ColorName = 'Grey', SizeName='L', Qty = 6

union select ItemNumber = '725', ColorName = 'Grey', SizeName='XL', Qty = 7

union select ItemNumber = '725', ColorName = 'Navy', SizeName='12', Qty = 8

union select ItemNumber = '725', ColorName = 'Navy', SizeName='XXS', Qty = 9

union select ItemNumber = '725', ColorName = 'Navy', SizeName='XS', Qty = 10

union select ItemNumber = '725', ColorName = 'Navy', SizeName='S', Qty = 11

union select ItemNumber = '725', ColorName = 'Navy', SizeName='M', Qty = 12

union select ItemNumber = '725', ColorName = 'Navy', SizeName='L', Qty = 13

union select ItemNumber = '725', ColorName = 'Navy', SizeName='XL', Qty = 1

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='12', Qty = 2

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='XXS', Qty = 3

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='XS', Qty = 4

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='S', Qty = 5

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='M', Qty = 6

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='L', Qty = 7

union select ItemNumber = '725', ColorName = 'Ivory', SizeName='XL', Qty = 8

union select ItemNumber = '818', ColorName = 'Navy', SizeName='12', Qty = 9

union select ItemNumber = '818', ColorName = 'Navy', SizeName='XXS', Qty = 10

union select ItemNumber = '818', ColorName = 'Navy', SizeName='XS', Qty = 11

union select ItemNumber = '818', ColorName = 'Navy', SizeName='S', Qty = 12

union select ItemNumber = '818', ColorName = 'Navy', SizeName='M', Qty = 13

union select ItemNumber = '818', ColorName = 'Navy', SizeName='L', Qty = 1

union select ItemNumber = '818', ColorName = 'Navy', SizeName='XL', Qty = 2

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='12', Qty = 3

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='XXS', Qty = 4

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='XS', Qty = 5

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='S', Qty = 6

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='M', Qty = 7

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='L', Qty = 8

union select ItemNumber = '818', ColorName = 'Admiral Blue', SizeName='XL', Qty = 9

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='12', Qty = 10

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='XXS', Qty = 11

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='XS', Qty = 12

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='S', Qty = 13

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='M', Qty = 1

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='L', Qty = 2

union select ItemNumber = '818', ColorName = 'Eggplant', SizeName='XL', Qty = 3

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='12', Qty = 4

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='XXS', Qty = 5

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='XS', Qty = 6

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='S', Qty = 7

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='M', Qty = 8

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='L', Qty = 9

union select ItemNumber = '818', ColorName = 'Port Wine', SizeName='XL', Qty = 10

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='12', Qty = 11

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='XXS', Qty = 12

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='XS', Qty = 13

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='S', Qty = 1

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='M', Qty = 2

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='L', Qty = 3

union select ItemNumber = '820', ColorName = 'Dark Rust', SizeName='XL', Qty = 4

union select ItemNumber = '820', ColorName = 'Natural', SizeName='12', Qty = 5

union select ItemNumber = '820', ColorName = 'Natural', SizeName='XXS', Qty = 6

union select ItemNumber = '820', ColorName = 'Natural', SizeName='XS', Qty = 7

union select ItemNumber = '820', ColorName = 'Natural', SizeName='S', Qty = 8

union select ItemNumber = '820', ColorName = 'Natural', SizeName='M', Qty = 9

union select ItemNumber = '820', ColorName = 'Natural', SizeName='L', Qty = 10

union select ItemNumber = '820', ColorName = 'Natural', SizeName='XL', Qty = 11

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='12', Qty = 12

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='XXS', Qty = 13

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='XS', Qty = 1

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='S', Qty = 2

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='M', Qty = 3

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='L', Qty = 4

union select ItemNumber = '820', ColorName = 'Port Wine', SizeName='XL', Qty = 5

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='12', Qty = 6

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='XXS', Qty = 7

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='XS', Qty = 8

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='S', Qty = 9

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='M', Qty = 10

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='L', Qty = 11

union select ItemNumber = '822', ColorName = 'Admiral', SizeName='XL', Qty = 12

union select ItemNumber = '822', ColorName = 'Black', SizeName='12', Qty = 13

union select ItemNumber = '822', ColorName = 'Black', SizeName='XXS', Qty = 1

union select ItemNumber = '822', ColorName = 'Black', SizeName='XS', Qty = 2

union select ItemNumber = '822', ColorName = 'Black', SizeName='S', Qty = 3

union select ItemNumber = '822', ColorName = 'Black', SizeName='M', Qty = 4

union select ItemNumber = '822', ColorName = 'Black', SizeName='L', Qty = 5

union select ItemNumber = '822', ColorName = 'Black', SizeName='XL', Qty = 6

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='12', Qty = 7

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='XXS', Qty = 8

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='XS', Qty = 9

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='S', Qty = 10

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='M', Qty = 11

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='L', Qty = 12

union select ItemNumber = '822', ColorName = 'Ivory', SizeName='XL', Qty = 13

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='12', Qty = 1

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='XXS', Qty = 2

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='XS', Qty = 3

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='S', Qty = 4

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='M', Qty = 5

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='L', Qty = 6

union select ItemNumber = '822', ColorName = 'Eggplant', SizeName='XL', Qty = 7

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='12', Qty = 8

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='XXS', Qty = 9

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='XS', Qty = 10

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='S', Qty = 11

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='M', Qty = 12

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='L', Qty = 13

union select ItemNumber = '822', ColorName = 'Port Wine', SizeName='XL', Qty = 1
)
insert into Inventory(ItemColorId, SizeId, Qty)
select sc.ItemColorId, sz.SizeId, x.Qty
from x 
join Item s 
on s.ItemNumber = x.ItemNumber
join Color c 
on c.ColorName = x.ColorName
join ItemColor sc 
on s.ItemId = sc.ItemId 
and c.ColorId = sc.ColorId
join Sizes sz 
on sz.SizeName = x.SizeName


